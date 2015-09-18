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
