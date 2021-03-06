/*
 * html-template-parser
 * https://github.com/rainyjune/htmlTemplateParser
 *
 * Copyright (c) 2015 rainyjune
 * Licensed under the MIT license.
 */

'use strict';

var path = require('path');

module.exports = function(grunt) {

  var templateRegExpStr = "<!--\\s*template:(\\S+)\\s*-->([\\s\\S]*?)<!--\\s*\/template\\s*-->";
  var templateRegExp = new RegExp(templateRegExpStr, "gi");
  var templateRegExpSingle = new RegExp(templateRegExpStr, "i");

  // Reads the entrie contents of a file.
  function entry(file, destDir) {
    var data = grunt.file.read(file, {encoding: 'utf8'});
    parseFileContents(data, file, destDir);
  }

  // The entry function of content parsing.
  function parseFileContents(contents, file, destDir) {
    contents = removeIgnoreParts(contents);
    contents = replacePlaceHolders(contents);
    var templateParsedResult = subtractTemplate(contents);
    contents = insertTemplateTags(templateParsedResult);
    saveParsedTemplate(contents, file, destDir);
  }

  function saveParsedTemplate(contents, file, destDir) {
    grunt.file.write(destDir + path.basename(file), contents);
  }

  function insertTemplateTags(templateParsedResult) {
    var contents = templateParsedResult.contents;
    var templatesArr = templateParsedResult.templatesArr;

    var templateStrArr = [];
    if (templatesArr.length) {
      for(var i = 0, len = templatesArr.length; i < len; i++) {
        templateStrArr.push(generateTemplateTag(templatesArr[i]));
      }
    }
    var templateStr = templateStrArr.join('\n\t\t\t');

    var templatesRegExp = /<!--\s*templates\s*-->/i;
    contents = contents.replace(templatesRegExp, templateStr);
    return contents;
  }

  /**
   * Remove all ignored HTML markups.
   * @param {string} contents
   * @returns {string}
   */
  function removeIgnoreParts(contents) {
    var pattern = /<!--\s*ignore\s*-->[\s\S]*?<!--\s*\/ignore\s*-->/gi;
    return contents.replace(pattern, '');
  }

  /**
   * Replace place holder contents with the values we specified.
   * Note: not works well on the <img> tag.
   * @param {string} contents
   * @returns {string}
   */
  function replacePlaceHolders(contents) {
    var pattern = /<!--\s*placeholder:\s*([\s\S]*?)\s*-->[\s\S]*?<!--\s*\/placeholder\s*-->/gi;
    return contents.replace(pattern, '$1');
  }

  /**
   * Subtract all templates from a static HTML file.
   * @param {String} contents
   * @returns {Object}
   */
  function subtractTemplate(contents) {
    var templatesArr = [];
    var pattern = templateRegExp;
    var matchResult = contents.match(pattern);
    if (matchResult) {
      for (var i = 0, len = matchResult.length; i < len; i++) {
        templatesArr.push(matchResult[i]);
      }
       contents = contents.replace(pattern, '');
    }
    return {
      "contents": contents,
      "templatesArr": templatesArr 
    };
  }

  /**
   * Generates a <script> tag to hold a template.
   * @param {String} rawTemplateString
   * @returns {String}
   */
  function generateTemplateTag(rawTemplateString) {
    var pattern = templateRegExpSingle;
    var matchResult = rawTemplateString.match(pattern);
    if (matchResult) {
      var templateId = matchResult[1];
      var templateContent = matchResult[2];
      var templateString = "<script type='text/html' id='"+templateId+"'>" + templateContent + "</script>";
      return templateString;
    }
    return '';
  }
  
  grunt.registerMultiTask('htmltemplateparser', 'This is the html-template-parser task.', function(){
    var target = this.target,
        data = this.data;
        
    data.files.forEach(function(value){
      entry(value, data.dest);
    });
    
  });
};