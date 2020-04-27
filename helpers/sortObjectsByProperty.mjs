/**
 * @module sortObjectsByPropertyMjs
 * Sorts an array of objects by an object property.
 */

/**
 * Sorts objects by a specified property.
 * @param {Object[]} arr Array of objects to be sorted
 * @param {String} p Name of property to sort by
 * @param {Boolean} [caseSensitive=false] Whether or not to perform a case-sensitive sort
 * @return {Object[]} Sorted array of objects
 */
export default function sortObjectsByProperty(arr, p, caseSensitive = false) {
  return arr.sort(sortByProperty(p, caseSensitive));
}

/**
 * Performs property sorting.
 * @param {String} p Name of property to sort by
 * @param {Boolean} [caseSensitive=false] Whether or not to perform a case-sensitive sort
 * @return {Function} Sort function
 */
export function sortByProperty(p, caseSensitive = false) {
  return (a, b) => {
    const firstEl = typeof a[p] === 'string' && !caseSensitive ? a[p].toLowerCase() : a[p];
    const secondEl = typeof b[p] === 'string' && !caseSensitive ? b[p].toLowerCase() : b[p];
    if (firstEl < secondEl) {
      return -1;
    }

    /* istanbul ignore else */
    if (firstEl > secondEl) {
      return 1;
    }

    return 0;
  };
}
