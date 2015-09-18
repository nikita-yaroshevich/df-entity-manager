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
