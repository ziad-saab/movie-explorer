var app = angular.module('MovieRecommender', ['CacheModule']);

app.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: 'view/index.html'
  });
  $routeProvider.when('/trending', {
    templateUrl: 'view/trending.html'
  });
  $routeProvider.when('/trending/:genre', {
    templateUrl: 'view/trending.html'
  });
  $routeProvider.when('/search', {
    templateUrl: 'view/search.html'
  });
  $routeProvider.when('/search/:query', {
    templateUrl: 'view/search.html'
  });
  $routeProvider.when('/related/:id/:title', {
    templateUrl: 'view/related.html'
  });
}]);

app.service('trakt', ['$http', '$q', 'cacheService', function($http, $q, cacheService) {
  this.getTrendingMovies = function() {
    var def = $q.defer();
    
    var result = cacheService.get('trending');
    if (result) {
      def.resolve(result);
    }
    else {
      var get = $http.jsonp('http://api.trakt.tv/movies/trending.json/bdeb843f17dba1f9e8743472a25d6814?callback=JSON_CALLBACK');
      get.then(function(result) {
        cacheService.set('trending', result, 300);
        def.resolve(result);
      });
    }
    return def.promise;
  };

  this.searchMovies = function(query) {
    var def = $q.defer();

    var result = cacheService.get('query-' + query);
    if (result) {
      def.resolve(result);
    }
    else {
      var get = $http.jsonp('http://api.trakt.tv/search/movies.json/bdeb843f17dba1f9e8743472a25d6814/' + query + '?callback=JSON_CALLBACK');
      get.then(function(result) {
        cacheService.set('query-' + query, result, 300);
        def.resolve(result);
      });
    }
    return def.promise;
  };

  this.relatedMovies = function(id) {
    var def = $q.defer();

    var result = cacheService.get('related-' + id);
    if (result) {
      def.resolve(result);
    }
    else {
      var get = $http.jsonp('http://api.trakt.tv/movie/related.json/bdeb843f17dba1f9e8743472a25d6814/' + id + '?callback=JSON_CALLBACK');
      get.then(function(result) {
        cacheService.set('query-' + id, result, 300);
        def.resolve(result);
      });
    }
    return def.promise;
  }
}]);

// TODO: refactor movie list as a directive
app.controller('TrendingController', ['$scope', '$routeParams', '$timeout', 'trakt', function($scope, $routeParams, $timeout, trakt) {
  var that = this;
  
  that.isLoading = true;
  that.movies = [];
  that.genre = $routeParams.genre;
  that.isFiltered = !!that.genre;
  
  var stored_result;
  trakt.getTrendingMovies().then(
    function(result) {
      that.isLoading = false;
      that.movies = [];
      var extRegex = /\.[^.]+$/;
      stored_result = result.data;
      
      function addResults() {
        var movie, ptr = 0;
        while ((movie = stored_result.shift()) && ++ptr < 10) {
          if (!that.isFiltered || (movie.genres && movie.genres.indexOf && movie.genres.indexOf(that.genre) >= 0)) {
            that.movies.push({
              id: movie.imdb_id,
              title: movie.title,
              year: movie.year,
              image: movie.images.poster.replace(extRegex, '-300$&'),
              tagline: movie.tagline,
              overview: movie.overview,
              genres: movie.genres
            });
          }
        }
        if (stored_result.length > 0) {
          $timeout(addResults, 50);
        }
      }
      addResults();
    }
  );
  
  $scope.TrendingController = that;
}]);

app.controller('SearchController', ['$scope', '$routeParams', '$timeout', 'trakt', function($scope, $routeParams, $timeout, trakt) {
  var that = this;
  
  that.isLoading = false;
  that.isSearching = false;
  that.movies = [];
  
  that.doSearch = function() {
    window.location = '#/search/' + that.query;
  };
  
  if (that.query = $routeParams.query) {
    that.isLoading = true;
    that.isSearching = true;
    var stored_result;
    trakt.searchMovies(that.query).then(
      function(result) {
        that.isLoading = false;
        that.movies = [];
        var extRegex = /\.[^.]+$/;
        stored_result = result.data;

        function addResults() {
          var movie, ptr = 0;
          while ((movie = stored_result.shift()) && ++ptr < 10) {
            if (!that.isFiltered || (movie.genres && movie.genres.indexOf && movie.genres.indexOf(that.genre) >= 0)) {
              that.movies.push({
                id: movie.imdb_id,
                title: movie.title,
                year: movie.year,
                image: movie.images.poster.replace(extRegex, '-300$&'),
                tagline: movie.tagline,
                overview: movie.overview,
                genres: movie.genres
              });
            }
          }
          if (stored_result.length > 0) {
            $timeout(addResults, 50);
          }
        }
        addResults();
      }
    )
  }
  
  $scope.SearchController = that;
}]);

app.controller('RelatedController', ['$scope', '$routeParams', '$timeout', 'trakt', function($scope, $routeParams, $timeout, trakt) {
  var that = this;

  that.isLoading = true;
  that.movies = [];
  that.title = $routeParams.title;


  var stored_result;
  trakt.relatedMovies($routeParams.id).then(
    function(result) {
      that.isLoading = false;
      that.movies = [];
      var extRegex = /\.[^.]+$/;
      stored_result = result.data;

      function addResults() {
        var movie, ptr = 0;
        while ((movie = stored_result.shift()) && ++ptr < 10) {
          if (!that.isFiltered || (movie.genres && movie.genres.indexOf && movie.genres.indexOf(that.genre) >= 0)) {
            that.movies.push({
              id: movie.imdb_id,
              title: movie.title,
              year: movie.year,
              image: movie.images.poster.replace(extRegex, '-300$&'),
              tagline: movie.tagline,
              overview: movie.overview,
              genres: movie.genres
            });
          }
        }
        if (stored_result.length > 0) {
          $timeout(addResults, 50);
        }
      }
      addResults();
    }
  );

  $scope.RelatedController = that;
}]);
