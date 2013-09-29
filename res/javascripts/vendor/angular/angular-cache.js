(function() {
  var angularCache = angular.module('CacheModule', ['LocalStorageModule']);
  
  angularCache.service('cacheService', ['localStorageService', function(localStorageService) {
    var CACHE_PREFIX = 'cache-';
    var EXPIRE_PREFIX = CACHE_PREFIX + 'expire-';
    var VALUE_PREFIX = CACHE_PREFIX + 'value-';
    var TIME_UNIT = 1000;
    
    // cleanup
    var cleanupKeys;
    var CLEANUP_MAX = 100;
    function doCleanup() {
      if (!cleanupKeys) {
        cleanupKeys = localStorageService.keys();
      }
      var expRegex = new RegExp('^' + EXPIRE_PREFIX);
      var key;
      var start_time = new Date().getTime();
      while ((key = cleanupKeys.pop()) && (new Date().getTime() - start_time < CLEANUP_MAX)) {
        if (key.indexOf(EXPIRE_PREFIX) == 0) {
          var exp = localStorageService.get(key);
          if (exp < start_time) {
            localStorageService.remove(key);
            localStorageService.remove(key.replace(expRegex, VALUE_PREFIX));
          }
        }
      }
      if (cleanupKeys.length > 0) {
        setTimeout(doCleanup, 5000);
      }
    }
    setTimeout(doCleanup, 0);
    
    return {
      get: function(key) {
        var itemExp = localStorageService.get(EXPIRE_PREFIX + key);
        var itemVal = localStorageService.get(VALUE_PREFIX + key);
        
        if (itemExp && itemVal && (itemExp > new Date().getTime())) {
          return itemVal;
        }
        else {
          return null;
        }
      },
      set: function(key, value, ttl_seconds) {
        var itemValKey = VALUE_PREFIX + key;
        var itemExpKey = EXPIRE_PREFIX + key;
        localStorageService.set(itemValKey, value);
        localStorageService.set(itemExpKey, new Date().getTime() + ttl_seconds * TIME_UNIT);
      }
    }
  }]);
})();