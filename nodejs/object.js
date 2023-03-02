/**
 * Contains utility functions related to 'Object'.
 */

const dot = require("dot-object");
const util = require("util");
const merge = require("deepmerge");
/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
const isObject = (item) =>
  item && typeof item === "object" && !Array.isArray(item);

/**
 * Simple array check.
 * @param item
 * @returns {boolean}
 */
const isArray = (item) =>
  item && typeof item === "object" && Array.isArray(item);

/**
 * To check whether a string like [0] or [banner] is an array notation or not
 * @param {string} key
 * @returns @boolean
 */
const isArrayNotation = (key) => !!key.match(/\[(\d{1,})/gm);

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 * reference: https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge
 * author (answer by): Rubens Mariuzzo and Salakar
 */
const mergeDeep = (target, ...sources) => {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    });
  }

  return mergeDeep(target, ...sources);
};

/**
 * To print the whole object value to the log
 * @param {*} obj
 * @returns void
 * Reference: https://stackoverflow.com/questions/10729276/how-can-i-get-the-full-object-in-node-jss-console-log-rather-than-object
 */
const deepPrint = (obj) =>
  console.log(
    util.inspect(obj, { showHidden: false, depth: null, colors: true })
  );

/**
 * Convert string like: [banner][0][create][entry][tagline]
 * To: { banner: [ { create: { entry: { tagline: 'My tagline' }}}]}
 * @param {string} key
 * @param {any} value
 * @returns @object or @array
 */

const convertKeyStringToObject = (key, value = null) => {
  const splittedKey = key.split("]").filter((x) => x); // filter to remove empty string value
  let objectNotation = "";
  splittedKey.forEach((_key) => {
    if (isArrayNotation(_key)) objectNotation += `${_key}]`;
    else objectNotation += _key.replace("[", ".");
  });
  if (objectNotation.charAt(0) === ".")
    objectNotation = objectNotation.substring(1);

  /**
   * If the object notation starts with array opening notation '[' , then it should return an array.
   * For example: [0][patch][entry][personal][email]
   * Would resulting: [{ patch: { entry: { personal: { email: 'example@mail.com' }}}}]
   */
  if (objectNotation.startsWith("[")) {
    objectNotation = `__array__${objectNotation}`;
    const result = dot.str(objectNotation, value, {});
    return {
      key, // if the value is an array, the key will be null since it doesn't have object key as a parent
      value: result.__array__,
    };
  }

  /**
   * If it's not, it will return an object.
   * For example: banner[0][patch][entry][personal][email]
   * Would resulting: { banner: [{ patch: { entry: { personal: { email: 'example@mail.com' }}}}]}
   */
  const result = dot.str(objectNotation, value, {});
  const objectKey = Object.keys(result)[0];
  const arrayKey = Array.isArray(result[objectKey])
    ? result[objectKey].findIndex((x) => x)
    : undefined;

  return {
    key: objectKey,
    arrayKey,
    value: result,
  };
};
/**
 * To clean the object that has object keys like '[personal][0][social_media][url]'
 * to a proper object
 * @param {*} source
 * @param {*} parentKey
 * @returns
 * Author: Arif Rachman Hakim
 * Also credits to: deepmerge npm package
 */
const cleanObject = (source, parentKey = undefined) => {
  if (source === undefined) return {};
  if (isObject(source)) {
    let result = {};
    const tempArray = [];
    Object.entries(source).forEach(([objectKey, objectValue]) => {
      const { key, value, arrayKey } = convertKeyStringToObject(
        objectKey,
        objectValue
      );
      if (isObject(value)) {
        if (isArray(result[key])) {
          const cleanedObject = cleanObject(value[key], objectKey);
          if (isArray(cleanedObject)) {
            if (result[key][arrayKey]) {
              result[key][arrayKey] = Object.assign(
                result[key][arrayKey],
                value[key][arrayKey]
              );
            } else
              result[key] = [
                ...result[key],
                ...cleanObject(value[key], objectKey),
              ];
          } else
            result[key] = [...result[key], cleanObject(value[key], objectKey)];
        } else
          Object.assign(result, {
            [key]: cleanObject(value[key], objectKey),
          });
      } else if (isArray(value)) {
        value.forEach((val, index) => {
          if (val)
            tempArray[index] = tempArray[index]
              ? merge(tempArray[index], val)
              : merge({}, val);
        });
        result = tempArray;
      } else {
        Object.assign(result, value);
      }
    });
    return result;
  }
  if (isArray(source)) {
    const result = [];
    source.forEach((src) => {
      const cleanedObject = cleanObject(src, parentKey);
      result.push(cleanedObject);
    });
    return result;
  }
  return source;
};
/**
 * arrayMerge's option function
 * Combines objects at the same index in the two arrays.
 * @param {*} target
 * @param {*} source
 * @param {*} options
 * @returns
 * Reference: https://github.com/TehShrike/deepmerge#api
 */
const combineMerge = (target, source, options) => {
  const destination = target.slice();

  source.forEach((item, index) => {
    if (typeof destination[index] === "undefined") {
      destination[index] = options.cloneUnlessOtherwiseSpecified(item, options);
    } else if (options.isMergeableObject(item)) {
      destination[index] = merge(target[index], item, options);
    } else if (target.indexOf(item) === -1) {
      destination.push(item);
    }
  });
  return destination;
};

const cleanAndDeepMerge = (arrayOfObjects) =>
  merge.all(
    arrayOfObjects.map((obj) => cleanObject(obj)),
    {
      arrayMerge: combineMerge,
    }
  );

module.exports = {
  cleanAndDeepMerge,
  mergeDeep,
  isObject,
  convertKeyStringToObject,
  isArrayNotation,
  cleanObject,
  deepPrint,
};
