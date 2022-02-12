'use strict';

import { performance } from 'perf_hooks';

export default class Util {
  static removeAllWhiteSpaces(str) {
    return str.trim().replace(/\s/g, "");
  }

  static safeFuncCall(func, ...args) {
    if (func !== null && typeof func === 'function')
      func(...args);
  }

  static isEmptyObj(obj) {
    // because Object.keys(new Date()).length === 0;
    // we have to do some additional check
    return Object.keys(obj).length === 0 && obj.constructor === Object;
  }

  static areDefinedIn(obj: any, properties: Array<string>) {
    for (let i=0; i<properties.length; ++i) {
      const prop: string = properties[i];
      if (obj[prop] === undefined)
        return false;
    }
  
    return true;
  }

  static areDefinedIn2(obj: any, properties: Array<string>) {
    const keys = Object.keys(obj);
  
    for (let i=0; i<properties.length; ++i) {
      const prop: string = properties[i];
      const result = keys.filter((key: string) => key === prop);
      if (result.length === 0)
        return false;
    }
  
    return true;
  }

  static splitArray(array, partArraySize) {
    let result = [];
    for(let i=0; i<array.length; i+=partArraySize) {
      const end = (i+partArraySize > array.length) ? array.length : i + partArraySize;
      result.push(array.slice(i,end));
    }

    return result;
  }

  static sliceAndPush(src, dst, finalSize: number) {
    // src의 끝에서부터 dst 길이만큼 엘레맨트를 제거한후..
    // dst 뒤에 src를 붙인다. 그럼 dst게 src의 앞쪽에 붙은것과 같은 효과임.
    let result = null;
    if (src.length + dst.length > finalSize) {
      // .slice(0, 0) 이면 []을 반환
      let sliced = src.slice(0, src.length - dst.length);
      // dst 뒤에 src를 붙인다. 그럼 dst게 src의 앞쪽에 붙은것과 같은 효과임.
      result = dst.concat(src.slice(0, src.length - dst.length));
      result = result.slice(0, finalSize);
    }
    else {
      result = dst.concat(src);
    }
    return result;
  }

  static removeElementAt(arr: Array<any>, idx: number): Array<any> {
    const pre: Array<any> = arr.splice(0, idx);
    const post: Array<any> = arr.splice(1);
    return pre.concat(post);
  }

  static async(func, onSuccess=null, onFailed=null) {
    setTimeout(() => {
      if(func())
        Util.safeFuncCall(onSuccess);
      else
        Util.safeFuncCall(onFailed);
    }, 0);
  }

  generateUUID () { // Public Domain/MIT
    var d = new Date().getTime();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
        d += performance.now(); //use high-precision timer if available
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  static getUUID() {
    return new Util().generateUUID();
  }

  static getRandomID(splitSectionLen: number=5): string {
    let _id = new Date().valueOf().toString(16);
    let splitIdx = _id.length - splitSectionLen;
    return _id.slice(0, splitIdx) + '-'+ _id.slice(-splitSectionLen);
  }

  static loadJSONFile(filepath) {
    const fs = require('fs');

    let data: string = '';
    try {
      data = fs.readFileSync(filepath, 'utf8');
    } catch(err) {
      if ((err as any).code === 'ENOENT') {
        console.error(`File not found! : ` + filepath);
        throw err;
      }
      else {
        throw err;
      }
    }

    let parsedData: object = {};
    try {
      parsedData = JSON.parse(data);
    } catch(err) {
      console.error(`Cannot parse : ` + filepath);
      throw err;
    }

    return parsedData;
  }

  // promise 순차적 실행 코드
  // 참고: https://stackoverflow.com/questions/24586110/resolve-promises-one-after-another-i-e-in-sequence
  // 참고: https://hackernoon.com/functional-javascript-resolving-promises-sequentially-7aac18c4431e

  // promise들을 순차적으로 실행
  static promiseSerial(tasks) {
    var result = Promise.resolve();
    tasks.forEach(task => {
      result = result.then(() => task());
    });
    return result;
  }
  
  // promise들을 순차적으로 실행하고, 각 promise들의 결과를 반환
  static promiseSerialWithResult(funcs) {
    return funcs.reduce((promise, func) =>
      promise.then(result => func().then(Array.prototype.concat.bind(result))),
      Promise.resolve([]))
  }

  static clearObjectValues(objToClear) {
    Object.keys(objToClear).forEach((param) => {
      if (objToClear[param] && (objToClear[param]).toString() === "[object Object]" ) {
        Util.clearObjectValues(objToClear[param]);
        delete objToClear[param];
      }
      else
        delete objToClear[param];
    })
    return objToClear;
  }

  // str에는 유효하지 않은 문자열(undefined, null, '')이 올 수도 있긴 한데
  // 1) 알파벳이나 특수 기호들은 확실히 없는 문자열만 오는걸로..
  // 2) 지수도 안됨.
  static removeTrailingZeros(str: string): string {
    if (!str || str.length === 0)
      return '';

    let dotIdx = str.indexOf('.');
    if (dotIdx === -1)
      return str;

    let stop: boolean = false;
    let i: number = str.length - 1;
    let lastZeroIdx: number = str.length;
    while (!stop && dotIdx < i) {
      if (str[i] === '0') {
        lastZeroIdx = i;
      }
      else
        stop = true;
      i -= 1;
    }

    if (lastZeroIdx === str.length) {
      return str;
    }
    else if (lastZeroIdx !== str.length && lastZeroIdx > 0) {
      if (lastZeroIdx - 1 >= 0 && str[lastZeroIdx - 1] === '.')
        return str.slice(0, lastZeroIdx + 1);
      else
        return str.slice(0, lastZeroIdx);
    }
    else {
      return '';
    }
  }

  static exponentialToStr(_no: number | string) {
    const strVal = String(_no);
    var data, leader, mag, multiplier, num, sign, str, z;

    /*
      * Remove scientific notation from a number
      *
      * After
      * http://stackoverflow.com/a/18719988/1877527
      */
    data = strVal.split(/[eE]/);
    if (data.length === 1) {
      return data[0]; // exponential이 아니라면 진행 안함.
    }
    z = "";
    sign = strVal.slice(0, 1) === "-" ? "-" : "";
    str = data[0].replace(".", "");
    mag = Number(data[1]) + 1;
    if (mag <= 0) {
      z = sign + "0.";
      while (!(mag >= 0)) {
        z += "0";
        ++mag;
      }
      num = z + str.replace(/^\-/, "");
      return num;
    }
    if (str.length <= mag) {
      mag -= str.length;
      while (!(mag <= 0)) {
        z += 0;
        --mag;
      }
      num = str + z;
      return num;
    } else {
      leader = parseFloat(data[0]);
      multiplier = Math.pow(10, parseInt(data[1]));
      return leader * multiplier;
    }
  }

  // 제한: 값으로 배열을 가지는 객체는 표현되지 못한다. (애초에 tuple에 담긴 정보가 배열과 객체를 구별하지 않음.)
  static tupleToObject(tuple) {
    if (tuple.length <= 1)
      return {};

    const obj = {}
    for (let i=0; i<tuple.length; ++i) {
      const key = tuple[i++];
      const value = tuple[i];
      obj[key] = (Array.isArray(value)) ? Util.tupleToObject(value) : value;
    }
    return obj;
  }

  // 제한: 값으로 배열을 가지는 객체는 표현되지 못한다. (애초에 tuple에 담긴 정보가 배열과 객체를 구별하지 않음.)
  static tupleToJSONString(tuple) {
    if (tuple.length <= 1)
      return {};
  
    let obj = '{';
    for (let i=0; i<tuple.length; ++i) {
      const key = tuple[i++];
      const value = tuple[i];
      obj += `"${key}":`;
      if (Array.isArray(value)) {
        obj += Util.tupleToJSONString(value);
      }
      else {
        obj += Util.isString(value) ? `"${value}"` : `${value}`;
      }
  
      if (i < tuple.length - 1) {
        obj += ',';
      }
    }
    return obj + '}';
  }

  static isString(value: any) {
    return (typeof value === 'string' || value instanceof String);
  }
}