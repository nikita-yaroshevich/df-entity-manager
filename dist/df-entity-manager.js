/**
 * @ngdoc module
 * @module df.entityManagerBundle
 * @name df.entityManagerBundle
 * @requires ng
 * @description
 * This module add "persistent" layer to the app by the OOP way. Developed by inspiration of Doctrine2 Project.
 * This bundle aims to solve following issues:
 *  - Easily switch between different API servers without huge code modification (f.e. Mongolab, Parse, SailsJS, Symfony2 API Rest bundle or any other)
 *  - Create one internal api to work with different types of objects
 *  - Allow transform responses to destination entities
 *  - etc
 *
 *  This Bundle didn't cover some features such as UnityOfFork, but it could be developed and installed as plugin.
 */
angular.module('df.entityManagerBundle', ['ng', 'df.validatorBundle'])
  .config(
  function () {
  })
  .run(function () {

  })
;

/**
 * @ngdoc service
 * @name BaseEntity
 * @description
 * This Class is wrapper for objects returned from service.
 * It's contains some helpful methods, and it is base Class for all other entities.
 * */
angular.module('df.entityManagerBundle')
  .factory('BaseEntity', [function () {

    /**
     * @ngdoc type
     * @name BaseEntity
     * @description
     * This Class is wrapper for objects returned from service.
     * It's contains some helpful methods, and it is base Class for all other entities.
     * Creates a new EntityManager that operates on the given API connection and uses the given Configuration.
     * @constructor
     *
     */
    function BaseEntity() {
      /**
       * @description get first argument as init data
       */
      this.$construct(arguments[0] || null);
    }

    BaseEntity.prototype = {

      /**
       * @ngdoc method
       * @name BaseEntity#$construct
       * @description
       * fill object with default and init data. Can be called inside constructor of child classes
       * can be used as
       * function ChildEntity(data) {
       *      this.$construct(data || null);
       *  }
       *
       *  or
       *
       *  BaseEntity.prototype.$construct.apply(this, arguments);
       * @param {object | Array} properties
       * @this BaseEntity
       * @return {BaseEntity}
       */
      $construct: function (properties) {
        if (properties) {
          angular.extend(this, properties);
        }
        return this;
      },

      /**
       * @ngdoc method
       * @name BaseEntity#$getId
       * @description Get current Entity Id
       * @this BaseEntity
       * @return {string|undefined}
       */
      $getId: function () {
        /**
         * currently it a bit redundant. It cover classic id, MongoDBRef and MongoDB
         */
        var id = this.id || this._id;
        return angular.isObject(id) ? id.$oid : id;
      }

    };

    /**
     * @ngdoc property
     * @name BaseEntity#repository
     * @static
     * @property {string | Function}    repository
     * @description
     * Repository which will manage this entity type.
     * If string then AngularJS DI container will be used, else could be the Class.
     * @this BaseEntity
     */
    BaseEntity.repository = 'BaseEntityRepository';

    BaseEntity.getValidationSchema = function(){
      return this.schema || {};
    };

    /**
     * @ngdoc method
     * @name BaseEntity#extend
     * @static
     * @description
     * Custom implementation of OOP inhering
     * BaseEntity.prototype.parentMethod.apply(this, arguments);
     * @param {function}     ChildClass
     * @returns {function}     Class
     */
    BaseEntity.extend = function (ChildClass) {
      var BaseClass = this;
      angular.extend(ChildClass, BaseClass);
      ChildClass.prototype = !ChildClass.prototype ? new BaseClass() : angular.copy(ChildClass.prototype, new BaseClass());
      return ChildClass;
    };
    return BaseEntity;
  }]);

/**
 * @ngdoc service
 * @name BaseEntityManager
 * @requires $http
 * @requires $q
 * @requires $injector
 * @requires dataTransformer
 * @description
 * The EntityManager is the central access point to all features such as`communication` layer, repository
 * */
angular.module('df.entityManagerBundle')
  .factory('BaseEntityManager',
  ['$http', '$q', '$injector', 'dataTransformer',
   function ($http, $q, $injector, dataTransformer) {


     /**
      * @ngdoc type
      * @name BaseEntityManager
      * @description This Class manage connections to the service.
      * Creates a new EntityManager that operates on the given API connection and uses the given Configuration.
      * @constructor
      *
      */
     function BaseEntityManager() {
       /**
        * @private
        * @type     {object}
        * @property {object}   settings                EntityManager configuration
        * @property {string}   settings.endpointURL    API Base url
        * @property {string}   settings.httpOptions    Default http options
        */
       this.settings = {
         endpointURL: '',
         httpOptions: {}
       };

       /**
        *
        * @type {Array}
        * @property    {Array}     repositories    collection of loaded repositories. Currently  unused
        */
       this.repositories = [];
     }


     BaseEntityManager.prototype = {
       /**
        * @ngdoc method
        * @name BaseEntityManager#$setEndpoint
        * @description Set endpoint url
        * @param {string} url
        * @this BaseEntityManager
        * @return {BaseEntityManager}
        */
       $setEndpoint: function (url) {
         this.settings.endpointURL = url;
         return this;
       },
       /**
        * @ngdoc method
        * @name BaseEntityManager#$getEndpoint
        * @description Get endpoint url
        * @this BaseEntityManager
        * @returns {string}
        */
       $getEndpoint: function () {
         return this.settings.endpointURL;
       },

       /**
        * @ngdoc method
        * @name BaseEntityManager#$getHttpOptions
        * @description return a copy of http properties
        * @this BaseEntityManager
        * @see http://docs.angularjs.org/api/ng/service/$http
        * @returns {object}
        */
       $getHttpOptions: function () {
         return angular.copy(this.settings.httpOptions);
       },
       /**
        * @ngdoc method
        * @name BaseEntityManager#$setHttpOptions
        * @description Sets the http options
        * @this BaseEntityManager
        * @param {object}   options
        * @see http://docs.angularjs.org/api/ng/service/$http
        * @returns {BaseEntityManager}
        */
       $setHttpOptions: function (options) {
         this.settings.httpOptions = options;
         return this;
       },

       /**
        * @ngdoc method
        * @name BaseEntityManager#$addHeader
        * @description Added one header to httpOptions.headers
        * @this BaseEntityManager
        * @see http://docs.angularjs.org/api/ng/service/$http*
        * @param {string} header      Header name
        * @param {string} value       Header value
        * @returns {BaseEntityManager}
        */
       $addHeader: function (header, value) {
         this.settings.httpOptions.headers = this.settings.httpOptions.headers || {};
         this.settings.httpOptions.headers[header] = value;
         return this;
       },

       /**
        * @ngdoc method
        * @name BaseEntityManager#$getSettings
        * @description Returns EntityManager settings
        * @this BaseEntityManager
        * @return {object}   settings                EntityManager configuration
        */
       $getSettings: function () {
         return angular.copy(this.settings);
       },

       /**
        *
        * @ngdoc method
        * @name BaseEntityManager#$getDefaultEntityName
        * @description Common Entity service name. all responses and requests will be wrapped on it
        * @this BaseEntityManager
        * @return {string}   settings                EntityManager configuration
        */
       $getDefaultEntityName: function () {
         return 'BaseEntity';
       },

       /**
        * @ngdoc method
        * @this BaseEntityManager
        * @name BaseEntityManager#$getRepository
        * @description
        * Gets\Assign an repository for an entity class. If first argument is string then will try to find service\factory
        * with specified name. And try to create instance of it. Also could be an Class or Object. Anyway it should
        * implements same interfaces such as BaseEntityRepository class
        * @param {string | BaseEntityRepository | object | function }     repositoryName      should implements same interfaces such as BaseEntityRepository class
        * @param {string}                                                 [entityName]        if specified set Entity type for target repository
        * @returns {BaseEntityRepository}
        */

       $getRepository: function (repositoryName, entityName) {
         var RepositoryClass = angular.isString(repositoryName) ? $injector.get(repositoryName) : repositoryName;

         var repository = angular.isFunction(RepositoryClass) ? new RepositoryClass() : RepositoryClass;

         if (!repository) {
           throw 'RepositoryNotFoundException';
         }
         if (!angular.isFunction(repository.$setEntityManager || repository.$$setEntityType)) {
           throw 'NotValidRepositoryException';
         }
         repository.$$setEntityType(null, entityName);
         repository.$setEntityManager(this);

         return repository;
       },

       /**
        * @ngdoc method
        * @this BaseEntityManager
        * @name BaseEntityManager#$getRepositoryByEntity
        * @description
        * Gets the repository for an entity class. If first argument is string then will try to find factory
        * with specified name. And try to get repository from it. Also could be an Class or Object. Anyway it should
        * implements same interfaces such as BaseEntity class.
        * Anyway it try to catch errors and in that cases it create repository by default
        *
        *
        * @param {string | BaseEntity | function}             [entityName]            should implements same interfaces such as BaseEntity class
        * @param {string}                                     [entityRealName]        if specified an real entity name. this string will be used for API url generation
        * @returns {BaseEntityRepository}
        */
       $getRepositoryByEntity: function (entityName, entityRealName) {
         //if (!entityName) {
         //  throw 'EntityTypeNotFoundedException';
         //}
         var EntityClass = $injector.get(this.$getDefaultEntityName());
         try {
           EntityClass = angular.isString(entityName) ? $injector.get(entityName) : entityName;
         } catch (e) {
           EntityClass = $injector.get(this.$getDefaultEntityName());
         }

         var repositoryName = angular.isFunction(EntityClass) ? EntityClass.repository : EntityClass.constructor.repository;
         var repository = this.$getRepository(repositoryName);
         if (!angular.isFunction(repository.$setEntityManager || repository.$$setEntityType)) {
           throw 'NotValidRepositoryException';
         }
         repository.$$setEntityType(EntityClass, entityRealName || entityName);
         return repository;
       },


       /**
        * @ngdoc method
        * @name BaseEntityManager#$get
        * @description
        * Send a get request. Can transform request\response
        * @this BaseEntityManager
        *
        * @param {object}    options    see http://docs.angularjs.org/api/ng/service/$http and also
        * @param {string | function}    options.requestTransformer    named transformer name or transformer function
        * @param {string | function}    options.responseTransformer   named transformer name or transformer function
        * @param {string | function}    options.data                  data to send
        * @returns {promise}
        */
       $get: function (options) {
         options = options || {};
         options.method = 'GET';
         return this.$$callRemote(options);
       },

       /**
        * @ngdoc method
        * @name BaseEntityManager#$delete
        * @description
        * Send a delete request. Can transform request\response
        * @this BaseEntityManager
        *
        * @param {object}    options    see http://docs.angularjs.org/api/ng/service/$http and also
        * @param {string | function}    options.requestTransformer    named transformer name or transformer function
        * @param {string | function}    options.responseTransformer   named transformer name or transformer function
        * @param {string | function}    options.data                  data to send
        * @returns {promise}
        */
       $delete: function (options) {
         options = options || {};
         options.method = 'DELETE';
         return this.$$callRemote(options);
       },


       /**
        * @ngdoc method
        * @name BaseEntityManager#$post
        * @description
        * Send a post request. Can transform request\response
        * @this BaseEntityManager
        *
        * @param {object}    options    see http://docs.angularjs.org/api/ng/service/$http and also
        * @param {string | function}    options.requestTransformer    named transformer name or transformer function
        * @param {string | function}    options.responseTransformer   named transformer name or transformer function
        * @param {string | function}    options.data                  data to send
        * @returns {promise}
        */
       $post: function (options) {
         options = options || {};
         options.method = 'POST';
         options.data = options.data || {};

         return this.$$callRemote(options);
       },


       /**
        * @ngdoc method
        * @name BaseEntityManager#$put
        * @description
        * Send a put request. Can transform request\response
        * @this BaseEntityManager
        *
        * @param {object}    options    see http://docs.angularjs.org/api/ng/service/$http and also
        * @param {string | function}    options.requestTransformer    named transformer name or transformer function
        * @param {string | function}    options.responseTransformer   named transformer name or transformer function
        * @param {string | function}    options.data                  data to send
        * @returns {promise}
        */
       $put: function (options) {
         options = options || {};
         options.method = 'PUT';
         if (angular.isUndefined(options.data)) {
           throw 'Data should be defined';
         }
         return this.$$callRemote(options);
       },


       /**
        * @ngdoc method
        * @name BaseEntityManager#$path
        * @description
        * Send a path request. Can transform request\response
        * @this BaseEntityManager
        *
        * @param {object}    options    see http://docs.angularjs.org/api/ng/service/$http and also
        * @param {string | function}    options.requestTransformer    named transformer name or transformer function
        * @param {string | function}    options.responseTransformer   named transformer name or transformer function
        * @param {string | function}    options.data                  data to send
        * @returns {promise}
        */
       $patch: function (options) {
         options = options || {};
         options.method = 'PATCH';
         if (angular.isUndefined(options.data)) {
           throw 'Data should be defined';
         }

         return this.$$callRemote(options);
       },


       /**
        *
        * @ngdoc method
        * @name BaseEntityManager#$get
        * @this BaseEntityManager
        * @description
        * Send request to API can transform request\responses
        *
        * @param {object}    options                      see http://docs.angularjs.org/api/ng/service/$http
        * @param {string | function}    options.requestTransformer    named transformer name or transformer function
        * @param {string | function}    options.responseTransformer   named transformer name or transformer function
        * @return {promise}
        */
       $$callRemote: function (options) {
         options = angular.extend(this.$getHttpOptions(), options);
         if (!options.url) {
           throw 'Url should be defined';
         }
         options.url = this.$getEndpoint() + this.$getUrl(options);
         var deferred = $q.defer();
         var self = this;

         if (options.requestTransformer) {
           options.data = dataTransformer.$chainReverseTransform(options.requestTransformer, options.data);
         }

         $http(options)
           .then(function (response) {
             var data = self.$$parseResponse(response, options);
             if (options.responseTransformer) {
               data = dataTransformer.$chainTransform(options.responseTransformer, data);
             }
             deferred.resolve(data);
           })
           .catch(function (response) {
             deferred.reject(response);
           });
         return deferred.promise;
       },

       /**
        * @protected
        * @description
        * search criteria parser
        * @param {*} options
        * @returns {string}
        */
       $$applyCriteria: function (options) {
         if (options.criteria) {
           angular.forEach(options.criteria, function (v, k) {
             options.url = options.url + '&' + k + '=' + JSON.stringify(v);
           });
         }
         return options;
       },

       /**
        *
        * @ngdoc method
        * @name BaseEntityManager#$getUrl
        * @this BaseEntityManager
        * @description
        * get url
        *
        * @param {object}    options                      see http://docs.angularjs.org/api/ng/service/$http
        * @return {string}
        */
       $getUrl: function (options) {
         return options.url;
         //var url = angular.isFunction(this._urlRoot) ? this._urlRoot() : this._urlRoot ;
       },

       /**
        * @ngdoc method
        * @name BaseEntityManager#$$parseResponse
        * @protected
        * @this BaseEntityManager
        * @description height level response parser to normalize data
        * @param response
        * @returns {data|*}
        */
       $$parseResponse: function (response, options) {
         return response.data;
       }
     };

     /**
      * @ngdoc method
      * @name BaseEntityManager#extend
      * @static
      * @this BaseEntityManager
      * @description
      * Custom implementation of OOP inhering.
      * To get access to the parent methods you can use
      * BaseEntity.prototype.parentMethod.apply(this, arguments);
      * @param {function}     ChildClass
      * @returns {function}     Class
      */
     BaseEntityManager.extend = function (ChildClass) {
       var BaseClass = this;
       angular.extend(ChildClass, BaseClass);
       ChildClass.prototype = !ChildClass.prototype ? new BaseClass() : angular.copy(ChildClass.prototype, new BaseClass());
       return ChildClass;
     };
     return BaseEntityManager;
   }]);

/**
 * @ngdoc service
 * @name BaseEntityRepository
 * @requires $q
 * @requires BaseEntity
 * @requires $parse
 * @description
 * An EntityRepository serves as a repository for entities with generic as well as business specific methods for retrieving entities.
 * This class is designed for inheritance and users can subclass this class to write their own repositories with business-specific methods to locate entities.
 * */
angular.module('df.entityManagerBundle')
  .factory('BaseEntityRepository',
  ['$q', 'BaseEntity', '$parse',
    function ($q, BaseEntity, $interpolate) {
      /**
       * @ngdoc type
       * @class BaseEntityRepository
       * @description This Class manage connections to the service.
       * his Class contains logic for CRUD or any other operations with models.
       * @constructor
       *
       */
      function BaseEntityRepository() {
        /**
         * @private
         * @description Base Entity type to wrap objects. By default BaseEntity used
         * @property {BaseEntity}   $$entityType      Class of the entity which serve this repository
         */
        this.$$entityType = BaseEntity;
        /**
         * @private
         * @description Required reference to EntityManager object
         * @property {BaseEntityManager}    $$entityManager     EntityManager for this repository
         */
        this.$$entityManager = null;
      }

      BaseEntityRepository.prototype = {

        /**
         * @ngdoc method
         * @name BaseEntityRepository#$getEntityType
         * @description return Class of the entity which serve this repository
         * @this BaseEntityRepository
         * @return {BaseEntity}
         */
        $getEntityType: function () {
          return this.$$entityType;
        },

        /**
         * @ngdoc method
         * @name BaseEntityRepository#$$setEntityType
         * @description set Class of the entity and it "Human Name"(used for url generation)
         * if entityName null, then EntityType constructor name will be used
         * @todo investigate probably will be better to remove this params
         * @this BaseEntityRepository
         *
         * @param {string | BaseEntity | function}             [entityType]        should implements same interfaces such as BaseEntity class. if none provided then will use BaseEntity
         * @param {string}                                     [entityName]        if specified an real entity name. this string will be used for API url generation
         * @return {this}
         */
        $$setEntityType: function (entityType, entityName) {
          this.$$entityType = entityType || this.$$entityType || BaseEntity;
          this.$$entityName = entityName || this.$$entityName || (entityType ? entityType.constructor.name : undefined);
          return this;
        },

        /**
         * @ngdoc method
         * @name BaseEntityRepository#$setEntityManager
         * @description set EntityManager which serve this repository
         * @this BaseEntityRepository
         * @return {this}
         */
        $setEntityManager: function (entityManager) {
          this.$$entityManager = entityManager;
          return this;
        },

        /**
         * @ngdoc method
         * @name BaseEntityRepository#$getEntityManager
         * @description get EntityManager for this Repository
         * @this BaseEntityRepository
         * @return {BaseEntityManager}
         */
        $getEntityManager: function () {
          return this.$$entityManager;
        },

        /**
         * @alias $getEntityManager
         * @returns {BaseEntityManager}
         */
        $getEM: function(){
          return this.$getEntityManager();
        },

        /**
         * @ngdoc method
         * @name BaseEntityRepository#$create
         * @description creates new Entity with init data
         * @this BaseEntityRepository
         * @return {BaseEntityManager}
         */
        $create: function (data) {
          var Entity = this.$getEntityType();
          return new Entity(data);
        },


        /**
         * @ngdoc method
         * @name BaseEntityRepository#$save
         * @description send Create\Update request to the server
         * @this BaseEntityRepository
         * @param {BaseEntity} entity
         * @param {*} [options]
         * @return {promise}
         */
        $save: function (entity, options) {
          options = options || {};
          var deferred = $q.defer();
          var method = entity.$getId() ? '$put' : '$post';
          options.data = entity;
          options.url = options.url || this.$$getEntityUrl(entity.$getId(), options);

          this.$getEntityManager()[method](options)
            .then(function(response){
              deferred.resolve(response);
            })
            .catch(function(response){
              deferred.reject(response);
            });
          return deferred.promise;
        },

//        /**
//         * @description send Create\Update request to the server
//         * @param {BaseEntity} | [{BaseEntity}] entity
//         * @param {*} options
//         * @returns {promise}
//         */
//        $bulkSave: function(entity, options){
//          options = options || {};
//          var deferred = $q.defer();
//          var entities = [];
//          if (angular.isArray(entity)) {
//            entities = entity;
//          }else{
//            entities.push(entity);
//          }
//          var self = this;
//          var count = entities.length;
//          var stats = { success : [], errors : []};
//          angular.forEach(entities, function (res) {
//            var opt = angular.copy(options);
//            opt.url = self.$$getEntityUrl(res.$getId(), options);
//            opt.data = res;
//            var method = res.$getId() ? '$put' : '$post';
//            self.$getEntityManager()[method](opt)
//              .then(function(){
//                stats.success.push(res);
//              })
//              .catch(function(){
//                stats.errors.push(res);
//              })
//              .finally(function(){
//                count--;
//                if(count === 0){
//                  deferred.resolve(stats);
//                }
//              });
//
//          });
//
//          return deferred.promise;
//        },

        /**
         * @ngdoc method
         * @name BaseEntityRepository#$remove
         * @description send delete request to the server
         * @this BaseEntityRepository
         * @param {BaseEntity} entity
         * @param {*} [options]
         * @return {promise}
         */
        $remove: function (entity, options) {
          options = options || {};
          var deferred = $q.defer();
          var entities = [];
          if (angular.isArray(entity)) {
            entities = entity;
          } else {
            entities.push(entity);
          }
          var self = this;
          var count = entities.length;
          var stats = { success : [], errors : []};
          var getIdFunction = this.$create().$getId;
          angular.forEach(entities, function (res) {
            var resId = res.$getId() ||  getIdFunction.apply(res);
            if (!resId){
              count--;
              return;
            }
            var opt = angular.copy(options);
            opt.url = self.$$getEntityUrl(resId, opt);
            self.$getEntityManager().$delete(opt)
              .then(function(){
                stats.success.push(res);
              })
              .catch(function(){
                stats.errors.push(res);
              })
              .finally(function(){
                count--;
                if(count === 0){
                  deferred.resolve(stats);
                }
              });

          });

          return deferred.promise;
        },

        /**
         * @ngdoc method
         * @name BaseEntityRepository#$find
         * @description fetch one entity from the server
         * @this BaseEntityRepository
         * @param {string} id
         * @param {*} [options]
         * @return {promise}
         */
        $find: function (id, options) {
          options = options || {};
          var deferred = $q.defer();
          var self = this;
          options.url = this.$$getEntityUrl(id, options);
          this.$getEntityManager().$get(options)
            .then(function (response) {
              var parsedData = self.$$parseResponse(response.length === 1 ? response[0] : response, options);
              var entity;
              try {
                entity = self.$create(parsedData);
              } catch (e) {
                deferred.reject('Not valid response type');
              }
              deferred.resolve(entity);
            }, deferred.reject);
          return deferred.promise;
        },

        /**
         * @ngdoc method
         * @name BaseEntityRepository#$findOrCreate
         * @description fetch one entity from the server or create one
         * @this BaseEntityRepository
         * @param {string} id
         * @param {*} [options]
         * @return {promise}
         */
        $findOrCreate: function (id, options) {
          var self = this;
          var defer = $q.defer();
          if (id === 'new'){
            defer.resolve(self.$create({}));
          } else {
            this.$find(id, options)
              .then(function(data){
                defer.resolve(data);
              })
              .catch(function(){
                defer.resolve(self.$create({}));
              });
          }
          return defer.promise;
        },

        /**
         * @ngdoc method
         * @name BaseEntityRepository#$findBy
         * @description search entities by criteria
         * @this BaseEntityRepository
         * @param {*} criteria
         * @param {*} [options]
         * @return {promise}
         */
        $findBy: function (criteria, options) {
          options = options || {};
          options.criteria = criteria || {};
          var deferred = $q.defer();
          var self = this;
          options.url = this.$$getEntityUrl(null, options);
          this.$getEntityManager().$get(options).then(function (response) {
            var parsedData = self.$$parseResponse(response, options);
            if (angular.isArray(parsedData)) {
              var models = [];
              angular.forEach(parsedData, function (data) {
                var entity;
                try {
                  entity = self.$create(data);
                } catch (e) {
                  deferred.reject('Not valid response type');
                }
                models.push(entity);
              });
              //this.addToCollection(entityName, models);
              deferred.resolve(models);
            } else {
              deferred.reject('Not a valid response, expecting an array');
            }
          }, deferred.reject);
          return deferred.promise;
        },
        /**
         * @ngdoc method
         * @name BaseEntityRepository#$findOneBy
         * @description search one entitie by criteria
         * @this BaseEntityRepository
         * @param {*} criteria
         * @param {*} [options]
         * @return {promise}
         */
        $findOneBy: function (criteria, options) {
          options = options || {};
          options.criteria = criteria || {};
          var deferred = $q.defer();
          var self = this;
          options.criteria.l = 1;
          this.$findBy(criteria, options)
            .then(function (models) {
              deferred.resolve(self.$create(models[0]));
            })
            .catch(function () {
              deferred.reject(arguments);
            });
          return deferred.promise;
        },

        /**
         * @ngdoc method
         * @name BaseEntityManager#$$parseResponse
         * @name BaseEntityManager#$$parseResponse
         * @protected
         * @this BaseEntityRepository
         * @description height level response parser to normalize data
         * @param {*} data
         * @param {*} options
         * @returns {data|*}
         */
        $$parseResponse: function (data, options) {
          options = options || {};
          return data;
        },

        /**
         * @ngdoc method
         * @name BaseEntityManager#$$getEntityUrl
         * @protected
         * @this BaseEntityRepository
         * @description return url for entity
         * @param {string}  id
         * @param {*}       options
         * @returns {string}
         */
        $$getEntityUrl: function (id, options) {
          options = options || {};
          var url = '/' + this.$$entityName;
          if (!id) {
            return url;
          }
          return url + '/' + id;
        },

        /**
         * @ngdoc method
         * @name BaseEntityManager#$parseUrl
         * @protected
         * @this BaseEntityRepository
         * @description
         * should parse url like "/user/{{id}}/edit/{{group}}" and return it with replaced params depends of context
         * @param {string}  url
         * @param {*}       context
         * @returns {string}
         */
        $parseUrl: function (url, context){
          throw 'Not well implemented';
          return $interpolate(url)(context);
        }
      };

      /**
       * @ngdoc method
       * @name BaseEntityManager#extend
       * @static
       * @description
       * Custom implementation of OOP inhering
       * BaseEntity.prototype.parentMethod.apply(this, arguments);
       * @param {function}     ChildClass
       * @returns {function}     Class
       */
      BaseEntityRepository.extend = function (ChildClass) {
        var BaseClass = this;
        angular.extend(ChildClass, BaseClass);
        ChildClass.prototype = !ChildClass.prototype ? new BaseClass() : angular.copy(ChildClass.prototype, new BaseClass());
        return ChildClass;
      };

      return BaseEntityRepository;
    }]);

/**
 * Created by Nikita Yaroshevich
 */

//'use strict';
angular.module('df.entityManagerBundle')
  .filter('transform', function (dataTransformer) {
    return function (obj, name) {
      return dataTransformer.$transform(name, obj);
    };
  })
  .filter('convertTo', function($injector){
    return function(data, className){
      try {
        var ClassName = $injector.get(className);
        if (ClassName instanceof Function){
          return new ClassName(data);
        }
        if (ClassName instanceof Object){
          return angular.extend({}, data, ClassName);
        }
        return data;
      } catch (e){
        return data;
      }
    };
  });

/**
 * @ngdoc service
 * @name cacheIt
 * @description
 * Small cache service
 * */
angular.module('df.entityManagerBundle')
  .service('cacheIt', function ($cacheFactory) {

    /**
     * @class
     * @constructor
     */
    function CacheIt() {
    }

    /**
     *
     * @type CacheIt
     */
    CacheIt.prototype = {
      /**
       *
       * @param tag
       * @return {Cache}
       */
      $$getTagStorage: function (tag) {
        try {
          return $cacheFactory.get('cacheIt-tag-' + tag) || $cacheFactory('cacheIt-tag-' + tag);
        } catch (e) {
          return $cacheFactory('cacheIt-tag-' + tag);
        }
      },
      $invalidate: function (tag, key) {
        if (key){

        }
        var tagStorage = this.$$getTagStorage(tag);
        if (key) {
          tagStorage.remove(key);
        } else {
          tagStorage.destroy();
        }
      },
      /**
       * @method
       * @param tag
       * @param key
       * @return {*}
       */
      $get: function (tag, key) {
        return this.$$getTagStorage(tag).get(key);
      },
      /**
       * @method
       * @param tag
       * @param key
       * @param value
       * @return {*}
       */
      $set: function (tag, key, value) {
        var tagStorage = this.$$getTagStorage(tag);
        return tagStorage.put(key, value);
      },
      /**
       * @method
       * @param tag
       * @param key
       * @return {boolean}
       */
      $has: function (tag, key) {
        return this.$get(tag, key) !== undefined;
      }
    };

    return new CacheIt();
  });

/**
 * @ngdoc service
 * @name dataTransformer
 * @description
 * This service is collection of named registered data transformers. They used to transform responses\requests
 * */
angular.module('df.entityManagerBundle')
  .service('dataTransformer', function ($injector) {

    /**
     * @ngdoc type
     * @name DataTransformer
     * @description
     * This service is collection of named registered data transformers. They used to transform responses\requests or
     * can transform any data in both or only one direction.
     * @constructor
     *
     */
    function DataTransformer() {

    }

    /**
     * @description collection of transformers
     * @private
     * @type {*}
     */
    var transformer_collection = {};

    DataTransformer.prototype = {
      /**
       * @ngdoc method
       * @name DataTransformer#$add
       * @description add new data trasformer
       * @this  DataTransformer
       * @param {string}      name
       * @param {function | object | string} transformer             service name, or function or object
       * @param {function}          transformer.$transform           function which will transform data in main (serialize) or in both (deserialize) ways
       * @param {function}          transformer.$reverseTransform    function which will transform data in reverse way (deserialize)
       * @return {DataTransformer}
       */
      $add: function add(name, transformer) {
        transformer_collection[name] = transformer;
        return this;
      },

      /**
       * @ngdoc method
       * @name DataTransformer#$get
       * @description return registered transformer
       * @this  DataTransformer
       * @param {string} name
       * @return {object | function}
       */
      $get: function get(name) {
        var transformer = transformer_collection[name];
        if (angular.isString(transformer)) {
          try {
            transformer = $injector.get(transformer);
          } catch (e) {
            throw e;
          }
        }
        return transformer;
      },

      /**
       * @ngdoc method
       * @name DataTransformer#$has
       * @description is transformer registered
       * @this  DataTransformer
       * @param {string} name
       * @return {boolean}
       */
      $has: function has(name) {
        return transformer_collection[name] !== undefined;
      },

      /**
       * @ngdoc method
       * @name DataTransformer#$remove
       * @description remove transformer from collection
       * @this  DataTransformer
       * @param {string}      name
       * @return {DataTransformer}
       */
      $remove: function remove(name) {
        delete transformer_collection[name];
        return this;
      },

      /**
       * @ngdoc method
       * @name DataTransformer#$transform
       * @description transform data
       * @this  DataTransformer
       * @param {string}      name      transformer name
       * @param {*}           object    data to transform
       * @return {*}
       */
      $transform: function transform(name, object) {
        if (!this.$has(name)) {
          return object;
        }

        var transformer = this.$get(name);
        if (angular.isFunction(transformer)) {
          return transformer(object);
        }
        if (angular.isObject(transformer) && angular.isFunction(transformer.$transform)) {
          return transformer.$transform(object);
        }

        return object;
      },

      $chainTransform: function chainTransform(chain, object) {
        if (angular.isString(chain)) {
          chain = chain.split(/[\s,]+/);
        }
        var result = object;
        for (var i = 0; i < chain.length; i++) {
          result = this.$transform(chain[i], result);
        }
        return result;
      },


      $chainReverseTransform: function chainReverseTransform(chain, object) {
        if (angular.isString(chain)) {
          chain = chain.split(/[\s,]+/);
        }
        var result = object;
        for (var i = 0; i < chain.length; i++) {
          result = this.$reverseTransform(chain[i], result);
        }
        return result;
      },


      /**
       * @ngdoc method
       * @name DataTransformer#$reverseTransform
       * @description transform data second way
       * @this  DataTransformer
       * @param {string}      name      transformer name
       * @param {*}           object    data to transform
       * @return {*}
       */
      $reverseTransform: function reverseTransform(name, object) {
        if (!this.$has(name)) {
          return object;
        }

        var transformer = this.$get(name);
        if (angular.isFunction(transformer)) {
          return transformer(object);
        }
        if (angular.isObject(transformer) && angular.isFunction(transformer.$reverseTransform)) {
          return transformer.$reverseTransform(object);
        }

        return object;
      }
    };

    return new DataTransformer();
  });

/**
 * Created by Nikita Yaroshevich for ppm-portable.
 */


//'use strict';
/**
 * @name validator
 * @description
 * validator service used by df.entityManagerBundle to validate any kind of objects. it use angular-form-for validation as core
 */
angular.module('df.entityManagerBundle')
  .factory('schemaTransformer', function ($parse, $injector) {
    function SchemaTransformer(schema) {
      this.schema = schema;
    }

    SchemaTransformer.prototype = {
      $$doTransform: function (object, schema) {
        var dto = {};
        var self = this;

        if (schema.__copy) {
          angular.forEach(schema.__copy, function (fieldName) {
            dto[fieldName] = object[fieldName];
          });
          //delete schema.__copy;
        }

        //console.log(object);
        angular.forEach(schema, function (path, key) {
          var value = null; //$parse(path)(object)
          try {
            if (angular.isObject(path)){
              value = self.$$doTransform(object, path);
            } else {
              value = $parse(path)(object);
              if (value === undefined){
                throw new Error();
              }
            }
          } catch (e) {
            try {
              value = eval(path);
              //console.log(value);
            }
            catch (e) {
              value = undefined;
            }
          }


          $parse(key).assign(dto, value);
        });
        delete dto.__copy;
        delete dto.__prefix;
        return dto;
      },

      $transform: function transform(object) {
        var schema = angular.copy(this.schema.response || this.schema.to || this.schema);
        if (schema.__prefix) {
          object = $parse(schema.__prefix)(object) || object;
          //delete schema.__prefix;
        }
        if (angular.isArray(object)) {
          var result = [];
          angular.forEach(object, function (o) {
            result.push(this.$$doTransform(o, schema));
          }, this);
          return result;
        }
        return this.$$doTransform(object, schema);
      },

      $reverseTransform: function reverseTransform(object) {
        var schema = angular.copy(this.schema.request || this.schema.from || this.schema);
        if (schema.__prefix) {
          object = $parse(schema.__prefix)(object) || object;
          //delete schema.__prefix;
        }
        if (angular.isArray(object)) {
          var result = [];
          angular.forEach(object, function (o) {
            result.push(this.$$doTransform(o, schema));
          }, this);
          return result;
        }
        return this.$$doTransform(object, schema);
      }
    };


    SchemaTransformer.$create = function (schema) {
      return new SchemaTransformer(schema);
    };

    return SchemaTransformer;
  });
