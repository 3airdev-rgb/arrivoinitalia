// worker:webcrypto-only
var webcrypto_only_default = {};

// node_modules/.pnpm/bcryptjs@3.0.2/node_modules/bcryptjs/index.js
var randomFallback = null;
function randomBytes(len) {
  try {
    return crypto.getRandomValues(new Uint8Array(len));
  } catch {
  }
  try {
    return webcrypto_only_default.randomBytes(len);
  } catch {
  }
  if (!randomFallback) {
    throw Error(
      "Neither WebCryptoAPI nor a crypto module is available. Use bcrypt.setRandomFallback to set an alternative"
    );
  }
  return randomFallback(len);
}
function setRandomFallback(random) {
  randomFallback = random;
}
function genSaltSync(rounds, seed_length) {
  rounds = rounds || GENSALT_DEFAULT_LOG2_ROUNDS;
  if (typeof rounds !== "number")
    throw Error(
      "Illegal arguments: " + typeof rounds + ", " + typeof seed_length
    );
  if (rounds < 4) rounds = 4;
  else if (rounds > 31) rounds = 31;
  var salt = [];
  salt.push("$2b$");
  if (rounds < 10) salt.push("0");
  salt.push(rounds.toString());
  salt.push("$");
  salt.push(base64_encode(randomBytes(BCRYPT_SALT_LEN), BCRYPT_SALT_LEN));
  return salt.join("");
}
function genSalt(rounds, seed_length, callback) {
  if (typeof seed_length === "function")
    callback = seed_length, seed_length = void 0;
  if (typeof rounds === "function") callback = rounds, rounds = void 0;
  if (typeof rounds === "undefined") rounds = GENSALT_DEFAULT_LOG2_ROUNDS;
  else if (typeof rounds !== "number")
    throw Error("illegal arguments: " + typeof rounds);
  function _async(callback2) {
    nextTick(function() {
      try {
        callback2(null, genSaltSync(rounds));
      } catch (err) {
        callback2(err);
      }
    });
  }
  if (callback) {
    if (typeof callback !== "function")
      throw Error("Illegal callback: " + typeof callback);
    _async(callback);
  } else
    return new Promise(function(resolve, reject) {
      _async(function(err, res) {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });
}
function hashSync(password2, salt) {
  if (typeof salt === "undefined") salt = GENSALT_DEFAULT_LOG2_ROUNDS;
  if (typeof salt === "number") salt = genSaltSync(salt);
  if (typeof password2 !== "string" || typeof salt !== "string")
    throw Error("Illegal arguments: " + typeof password2 + ", " + typeof salt);
  return _hash(password2, salt);
}
function hash(password2, salt, callback, progressCallback) {
  function _async(callback2) {
    if (typeof password2 === "string" && typeof salt === "number")
      genSalt(salt, function(err, salt2) {
        _hash(password2, salt2, callback2, progressCallback);
      });
    else if (typeof password2 === "string" && typeof salt === "string")
      _hash(password2, salt, callback2, progressCallback);
    else
      nextTick(
        callback2.bind(
          this,
          Error("Illegal arguments: " + typeof password2 + ", " + typeof salt)
        )
      );
  }
  if (callback) {
    if (typeof callback !== "function")
      throw Error("Illegal callback: " + typeof callback);
    _async(callback);
  } else
    return new Promise(function(resolve, reject) {
      _async(function(err, res) {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });
}
function safeStringCompare(known, unknown) {
  var diff = known.length ^ unknown.length;
  for (var i = 0; i < known.length; ++i) {
    diff |= known.charCodeAt(i) ^ unknown.charCodeAt(i);
  }
  return diff === 0;
}
function compareSync(password2, hash3) {
  if (typeof password2 !== "string" || typeof hash3 !== "string")
    throw Error("Illegal arguments: " + typeof password2 + ", " + typeof hash3);
  if (hash3.length !== 60) return false;
  return safeStringCompare(
    hashSync(password2, hash3.substring(0, hash3.length - 31)),
    hash3
  );
}
function compare(password2, hashValue, callback, progressCallback) {
  function _async(callback2) {
    if (typeof password2 !== "string" || typeof hashValue !== "string") {
      nextTick(
        callback2.bind(
          this,
          Error(
            "Illegal arguments: " + typeof password2 + ", " + typeof hashValue
          )
        )
      );
      return;
    }
    if (hashValue.length !== 60) {
      nextTick(callback2.bind(this, null, false));
      return;
    }
    hash(
      password2,
      hashValue.substring(0, 29),
      function(err, comp) {
        if (err) callback2(err);
        else callback2(null, safeStringCompare(comp, hashValue));
      },
      progressCallback
    );
  }
  if (callback) {
    if (typeof callback !== "function")
      throw Error("Illegal callback: " + typeof callback);
    _async(callback);
  } else
    return new Promise(function(resolve, reject) {
      _async(function(err, res) {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });
}
function getRounds(hash3) {
  if (typeof hash3 !== "string")
    throw Error("Illegal arguments: " + typeof hash3);
  return parseInt(hash3.split("$")[2], 10);
}
function getSalt(hash3) {
  if (typeof hash3 !== "string")
    throw Error("Illegal arguments: " + typeof hash3);
  if (hash3.length !== 60)
    throw Error("Illegal hash length: " + hash3.length + " != 60");
  return hash3.substring(0, 29);
}
function truncates(password2) {
  if (typeof password2 !== "string")
    throw Error("Illegal arguments: " + typeof password2);
  return utf8Length(password2) > 72;
}
var nextTick = typeof process !== "undefined" && process && typeof process.nextTick === "function" ? typeof setImmediate === "function" ? setImmediate : process.nextTick : setTimeout;
function utf8Length(string) {
  var len = 0, c = 0;
  for (var i = 0; i < string.length; ++i) {
    c = string.charCodeAt(i);
    if (c < 128) len += 1;
    else if (c < 2048) len += 2;
    else if ((c & 64512) === 55296 && (string.charCodeAt(i + 1) & 64512) === 56320) {
      ++i;
      len += 4;
    } else len += 3;
  }
  return len;
}
function utf8Array(string) {
  var offset = 0, c1, c2;
  var buffer = new Array(utf8Length(string));
  for (var i = 0, k = string.length; i < k; ++i) {
    c1 = string.charCodeAt(i);
    if (c1 < 128) {
      buffer[offset++] = c1;
    } else if (c1 < 2048) {
      buffer[offset++] = c1 >> 6 | 192;
      buffer[offset++] = c1 & 63 | 128;
    } else if ((c1 & 64512) === 55296 && ((c2 = string.charCodeAt(i + 1)) & 64512) === 56320) {
      c1 = 65536 + ((c1 & 1023) << 10) + (c2 & 1023);
      ++i;
      buffer[offset++] = c1 >> 18 | 240;
      buffer[offset++] = c1 >> 12 & 63 | 128;
      buffer[offset++] = c1 >> 6 & 63 | 128;
      buffer[offset++] = c1 & 63 | 128;
    } else {
      buffer[offset++] = c1 >> 12 | 224;
      buffer[offset++] = c1 >> 6 & 63 | 128;
      buffer[offset++] = c1 & 63 | 128;
    }
  }
  return buffer;
}
var BASE64_CODE = "./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split("");
var BASE64_INDEX = [
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  0,
  1,
  54,
  55,
  56,
  57,
  58,
  59,
  60,
  61,
  62,
  63,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19,
  20,
  21,
  22,
  23,
  24,
  25,
  26,
  27,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  28,
  29,
  30,
  31,
  32,
  33,
  34,
  35,
  36,
  37,
  38,
  39,
  40,
  41,
  42,
  43,
  44,
  45,
  46,
  47,
  48,
  49,
  50,
  51,
  52,
  53,
  -1,
  -1,
  -1,
  -1,
  -1
];
function base64_encode(b, len) {
  var off = 0, rs = [], c1, c2;
  if (len <= 0 || len > b.length) throw Error("Illegal len: " + len);
  while (off < len) {
    c1 = b[off++] & 255;
    rs.push(BASE64_CODE[c1 >> 2 & 63]);
    c1 = (c1 & 3) << 4;
    if (off >= len) {
      rs.push(BASE64_CODE[c1 & 63]);
      break;
    }
    c2 = b[off++] & 255;
    c1 |= c2 >> 4 & 15;
    rs.push(BASE64_CODE[c1 & 63]);
    c1 = (c2 & 15) << 2;
    if (off >= len) {
      rs.push(BASE64_CODE[c1 & 63]);
      break;
    }
    c2 = b[off++] & 255;
    c1 |= c2 >> 6 & 3;
    rs.push(BASE64_CODE[c1 & 63]);
    rs.push(BASE64_CODE[c2 & 63]);
  }
  return rs.join("");
}
function base64_decode(s, len) {
  var off = 0, slen = s.length, olen = 0, rs = [], c1, c2, c3, c4, o, code;
  if (len <= 0) throw Error("Illegal len: " + len);
  while (off < slen - 1 && olen < len) {
    code = s.charCodeAt(off++);
    c1 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
    code = s.charCodeAt(off++);
    c2 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
    if (c1 == -1 || c2 == -1) break;
    o = c1 << 2 >>> 0;
    o |= (c2 & 48) >> 4;
    rs.push(String.fromCharCode(o));
    if (++olen >= len || off >= slen) break;
    code = s.charCodeAt(off++);
    c3 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
    if (c3 == -1) break;
    o = (c2 & 15) << 4 >>> 0;
    o |= (c3 & 60) >> 2;
    rs.push(String.fromCharCode(o));
    if (++olen >= len || off >= slen) break;
    code = s.charCodeAt(off++);
    c4 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
    o = (c3 & 3) << 6 >>> 0;
    o |= c4;
    rs.push(String.fromCharCode(o));
    ++olen;
  }
  var res = [];
  for (off = 0; off < olen; off++) res.push(rs[off].charCodeAt(0));
  return res;
}
var BCRYPT_SALT_LEN = 16;
var GENSALT_DEFAULT_LOG2_ROUNDS = 10;
var BLOWFISH_NUM_ROUNDS = 16;
var MAX_EXECUTION_TIME = 100;
var P_ORIG = [
  608135816,
  2242054355,
  320440878,
  57701188,
  2752067618,
  698298832,
  137296536,
  3964562569,
  1160258022,
  953160567,
  3193202383,
  887688300,
  3232508343,
  3380367581,
  1065670069,
  3041331479,
  2450970073,
  2306472731
];
var S_ORIG = [
  3509652390,
  2564797868,
  805139163,
  3491422135,
  3101798381,
  1780907670,
  3128725573,
  4046225305,
  614570311,
  3012652279,
  134345442,
  2240740374,
  1667834072,
  1901547113,
  2757295779,
  4103290238,
  227898511,
  1921955416,
  1904987480,
  2182433518,
  2069144605,
  3260701109,
  2620446009,
  720527379,
  3318853667,
  677414384,
  3393288472,
  3101374703,
  2390351024,
  1614419982,
  1822297739,
  2954791486,
  3608508353,
  3174124327,
  2024746970,
  1432378464,
  3864339955,
  2857741204,
  1464375394,
  1676153920,
  1439316330,
  715854006,
  3033291828,
  289532110,
  2706671279,
  2087905683,
  3018724369,
  1668267050,
  732546397,
  1947742710,
  3462151702,
  2609353502,
  2950085171,
  1814351708,
  2050118529,
  680887927,
  999245976,
  1800124847,
  3300911131,
  1713906067,
  1641548236,
  4213287313,
  1216130144,
  1575780402,
  4018429277,
  3917837745,
  3693486850,
  3949271944,
  596196993,
  3549867205,
  258830323,
  2213823033,
  772490370,
  2760122372,
  1774776394,
  2652871518,
  566650946,
  4142492826,
  1728879713,
  2882767088,
  1783734482,
  3629395816,
  2517608232,
  2874225571,
  1861159788,
  326777828,
  3124490320,
  2130389656,
  2716951837,
  967770486,
  1724537150,
  2185432712,
  2364442137,
  1164943284,
  2105845187,
  998989502,
  3765401048,
  2244026483,
  1075463327,
  1455516326,
  1322494562,
  910128902,
  469688178,
  1117454909,
  936433444,
  3490320968,
  3675253459,
  1240580251,
  122909385,
  2157517691,
  634681816,
  4142456567,
  3825094682,
  3061402683,
  2540495037,
  79693498,
  3249098678,
  1084186820,
  1583128258,
  426386531,
  1761308591,
  1047286709,
  322548459,
  995290223,
  1845252383,
  2603652396,
  3431023940,
  2942221577,
  3202600964,
  3727903485,
  1712269319,
  422464435,
  3234572375,
  1170764815,
  3523960633,
  3117677531,
  1434042557,
  442511882,
  3600875718,
  1076654713,
  1738483198,
  4213154764,
  2393238008,
  3677496056,
  1014306527,
  4251020053,
  793779912,
  2902807211,
  842905082,
  4246964064,
  1395751752,
  1040244610,
  2656851899,
  3396308128,
  445077038,
  3742853595,
  3577915638,
  679411651,
  2892444358,
  2354009459,
  1767581616,
  3150600392,
  3791627101,
  3102740896,
  284835224,
  4246832056,
  1258075500,
  768725851,
  2589189241,
  3069724005,
  3532540348,
  1274779536,
  3789419226,
  2764799539,
  1660621633,
  3471099624,
  4011903706,
  913787905,
  3497959166,
  737222580,
  2514213453,
  2928710040,
  3937242737,
  1804850592,
  3499020752,
  2949064160,
  2386320175,
  2390070455,
  2415321851,
  4061277028,
  2290661394,
  2416832540,
  1336762016,
  1754252060,
  3520065937,
  3014181293,
  791618072,
  3188594551,
  3933548030,
  2332172193,
  3852520463,
  3043980520,
  413987798,
  3465142937,
  3030929376,
  4245938359,
  2093235073,
  3534596313,
  375366246,
  2157278981,
  2479649556,
  555357303,
  3870105701,
  2008414854,
  3344188149,
  4221384143,
  3956125452,
  2067696032,
  3594591187,
  2921233993,
  2428461,
  544322398,
  577241275,
  1471733935,
  610547355,
  4027169054,
  1432588573,
  1507829418,
  2025931657,
  3646575487,
  545086370,
  48609733,
  2200306550,
  1653985193,
  298326376,
  1316178497,
  3007786442,
  2064951626,
  458293330,
  2589141269,
  3591329599,
  3164325604,
  727753846,
  2179363840,
  146436021,
  1461446943,
  4069977195,
  705550613,
  3059967265,
  3887724982,
  4281599278,
  3313849956,
  1404054877,
  2845806497,
  146425753,
  1854211946,
  1266315497,
  3048417604,
  3681880366,
  3289982499,
  290971e4,
  1235738493,
  2632868024,
  2414719590,
  3970600049,
  1771706367,
  1449415276,
  3266420449,
  422970021,
  1963543593,
  2690192192,
  3826793022,
  1062508698,
  1531092325,
  1804592342,
  2583117782,
  2714934279,
  4024971509,
  1294809318,
  4028980673,
  1289560198,
  2221992742,
  1669523910,
  35572830,
  157838143,
  1052438473,
  1016535060,
  1802137761,
  1753167236,
  1386275462,
  3080475397,
  2857371447,
  1040679964,
  2145300060,
  2390574316,
  1461121720,
  2956646967,
  4031777805,
  4028374788,
  33600511,
  2920084762,
  1018524850,
  629373528,
  3691585981,
  3515945977,
  2091462646,
  2486323059,
  586499841,
  988145025,
  935516892,
  3367335476,
  2599673255,
  2839830854,
  265290510,
  3972581182,
  2759138881,
  3795373465,
  1005194799,
  847297441,
  406762289,
  1314163512,
  1332590856,
  1866599683,
  4127851711,
  750260880,
  613907577,
  1450815602,
  3165620655,
  3734664991,
  3650291728,
  3012275730,
  3704569646,
  1427272223,
  778793252,
  1343938022,
  2676280711,
  2052605720,
  1946737175,
  3164576444,
  3914038668,
  3967478842,
  3682934266,
  1661551462,
  3294938066,
  4011595847,
  840292616,
  3712170807,
  616741398,
  312560963,
  711312465,
  1351876610,
  322626781,
  1910503582,
  271666773,
  2175563734,
  1594956187,
  70604529,
  3617834859,
  1007753275,
  1495573769,
  4069517037,
  2549218298,
  2663038764,
  504708206,
  2263041392,
  3941167025,
  2249088522,
  1514023603,
  1998579484,
  1312622330,
  694541497,
  2582060303,
  2151582166,
  1382467621,
  776784248,
  2618340202,
  3323268794,
  2497899128,
  2784771155,
  503983604,
  4076293799,
  907881277,
  423175695,
  432175456,
  1378068232,
  4145222326,
  3954048622,
  3938656102,
  3820766613,
  2793130115,
  2977904593,
  26017576,
  3274890735,
  3194772133,
  1700274565,
  1756076034,
  4006520079,
  3677328699,
  720338349,
  1533947780,
  354530856,
  688349552,
  3973924725,
  1637815568,
  332179504,
  3949051286,
  53804574,
  2852348879,
  3044236432,
  1282449977,
  3583942155,
  3416972820,
  4006381244,
  1617046695,
  2628476075,
  3002303598,
  1686838959,
  431878346,
  2686675385,
  1700445008,
  1080580658,
  1009431731,
  832498133,
  3223435511,
  2605976345,
  2271191193,
  2516031870,
  1648197032,
  4164389018,
  2548247927,
  300782431,
  375919233,
  238389289,
  3353747414,
  2531188641,
  2019080857,
  1475708069,
  455242339,
  2609103871,
  448939670,
  3451063019,
  1395535956,
  2413381860,
  1841049896,
  1491858159,
  885456874,
  4264095073,
  4001119347,
  1565136089,
  3898914787,
  1108368660,
  540939232,
  1173283510,
  2745871338,
  3681308437,
  4207628240,
  3343053890,
  4016749493,
  1699691293,
  1103962373,
  3625875870,
  2256883143,
  3830138730,
  1031889488,
  3479347698,
  1535977030,
  4236805024,
  3251091107,
  2132092099,
  1774941330,
  1199868427,
  1452454533,
  157007616,
  2904115357,
  342012276,
  595725824,
  1480756522,
  206960106,
  497939518,
  591360097,
  863170706,
  2375253569,
  3596610801,
  1814182875,
  2094937945,
  3421402208,
  1082520231,
  3463918190,
  2785509508,
  435703966,
  3908032597,
  1641649973,
  2842273706,
  3305899714,
  1510255612,
  2148256476,
  2655287854,
  3276092548,
  4258621189,
  236887753,
  3681803219,
  274041037,
  1734335097,
  3815195456,
  3317970021,
  1899903192,
  1026095262,
  4050517792,
  356393447,
  2410691914,
  3873677099,
  3682840055,
  3913112168,
  2491498743,
  4132185628,
  2489919796,
  1091903735,
  1979897079,
  3170134830,
  3567386728,
  3557303409,
  857797738,
  1136121015,
  1342202287,
  507115054,
  2535736646,
  337727348,
  3213592640,
  1301675037,
  2528481711,
  1895095763,
  1721773893,
  3216771564,
  62756741,
  2142006736,
  835421444,
  2531993523,
  1442658625,
  3659876326,
  2882144922,
  676362277,
  1392781812,
  170690266,
  3921047035,
  1759253602,
  3611846912,
  1745797284,
  664899054,
  1329594018,
  3901205900,
  3045908486,
  2062866102,
  2865634940,
  3543621612,
  3464012697,
  1080764994,
  553557557,
  3656615353,
  3996768171,
  991055499,
  499776247,
  1265440854,
  648242737,
  3940784050,
  980351604,
  3713745714,
  1749149687,
  3396870395,
  4211799374,
  3640570775,
  1161844396,
  3125318951,
  1431517754,
  545492359,
  4268468663,
  3499529547,
  1437099964,
  2702547544,
  3433638243,
  2581715763,
  2787789398,
  1060185593,
  1593081372,
  2418618748,
  4260947970,
  69676912,
  2159744348,
  86519011,
  2512459080,
  3838209314,
  1220612927,
  3339683548,
  133810670,
  1090789135,
  1078426020,
  1569222167,
  845107691,
  3583754449,
  4072456591,
  1091646820,
  628848692,
  1613405280,
  3757631651,
  526609435,
  236106946,
  48312990,
  2942717905,
  3402727701,
  1797494240,
  859738849,
  992217954,
  4005476642,
  2243076622,
  3870952857,
  3732016268,
  765654824,
  3490871365,
  2511836413,
  1685915746,
  3888969200,
  1414112111,
  2273134842,
  3281911079,
  4080962846,
  172450625,
  2569994100,
  980381355,
  4109958455,
  2819808352,
  2716589560,
  2568741196,
  3681446669,
  3329971472,
  1835478071,
  660984891,
  3704678404,
  4045999559,
  3422617507,
  3040415634,
  1762651403,
  1719377915,
  3470491036,
  2693910283,
  3642056355,
  3138596744,
  1364962596,
  2073328063,
  1983633131,
  926494387,
  3423689081,
  2150032023,
  4096667949,
  1749200295,
  3328846651,
  309677260,
  2016342300,
  1779581495,
  3079819751,
  111262694,
  1274766160,
  443224088,
  298511866,
  1025883608,
  3806446537,
  1145181785,
  168956806,
  3641502830,
  3584813610,
  1689216846,
  3666258015,
  3200248200,
  1692713982,
  2646376535,
  4042768518,
  1618508792,
  1610833997,
  3523052358,
  4130873264,
  2001055236,
  3610705100,
  2202168115,
  4028541809,
  2961195399,
  1006657119,
  2006996926,
  3186142756,
  1430667929,
  3210227297,
  1314452623,
  4074634658,
  4101304120,
  2273951170,
  1399257539,
  3367210612,
  3027628629,
  1190975929,
  2062231137,
  2333990788,
  2221543033,
  2438960610,
  1181637006,
  548689776,
  2362791313,
  3372408396,
  3104550113,
  3145860560,
  296247880,
  1970579870,
  3078560182,
  3769228297,
  1714227617,
  3291629107,
  3898220290,
  166772364,
  1251581989,
  493813264,
  448347421,
  195405023,
  2709975567,
  677966185,
  3703036547,
  1463355134,
  2715995803,
  1338867538,
  1343315457,
  2802222074,
  2684532164,
  233230375,
  2599980071,
  2000651841,
  3277868038,
  1638401717,
  4028070440,
  3237316320,
  6314154,
  819756386,
  300326615,
  590932579,
  1405279636,
  3267499572,
  3150704214,
  2428286686,
  3959192993,
  3461946742,
  1862657033,
  1266418056,
  963775037,
  2089974820,
  2263052895,
  1917689273,
  448879540,
  3550394620,
  3981727096,
  150775221,
  3627908307,
  1303187396,
  508620638,
  2975983352,
  2726630617,
  1817252668,
  1876281319,
  1457606340,
  908771278,
  3720792119,
  3617206836,
  2455994898,
  1729034894,
  1080033504,
  976866871,
  3556439503,
  2881648439,
  1522871579,
  1555064734,
  1336096578,
  3548522304,
  2579274686,
  3574697629,
  3205460757,
  3593280638,
  3338716283,
  3079412587,
  564236357,
  2993598910,
  1781952180,
  1464380207,
  3163844217,
  3332601554,
  1699332808,
  1393555694,
  1183702653,
  3581086237,
  1288719814,
  691649499,
  2847557200,
  2895455976,
  3193889540,
  2717570544,
  1781354906,
  1676643554,
  2592534050,
  3230253752,
  1126444790,
  2770207658,
  2633158820,
  2210423226,
  2615765581,
  2414155088,
  3127139286,
  673620729,
  2805611233,
  1269405062,
  4015350505,
  3341807571,
  4149409754,
  1057255273,
  2012875353,
  2162469141,
  2276492801,
  2601117357,
  993977747,
  3918593370,
  2654263191,
  753973209,
  36408145,
  2530585658,
  25011837,
  3520020182,
  2088578344,
  530523599,
  2918365339,
  1524020338,
  1518925132,
  3760827505,
  3759777254,
  1202760957,
  3985898139,
  3906192525,
  674977740,
  4174734889,
  2031300136,
  2019492241,
  3983892565,
  4153806404,
  3822280332,
  352677332,
  2297720250,
  60907813,
  90501309,
  3286998549,
  1016092578,
  2535922412,
  2839152426,
  457141659,
  509813237,
  4120667899,
  652014361,
  1966332200,
  2975202805,
  55981186,
  2327461051,
  676427537,
  3255491064,
  2882294119,
  3433927263,
  1307055953,
  942726286,
  933058658,
  2468411793,
  3933900994,
  4215176142,
  1361170020,
  2001714738,
  2830558078,
  3274259782,
  1222529897,
  1679025792,
  2729314320,
  3714953764,
  1770335741,
  151462246,
  3013232138,
  1682292957,
  1483529935,
  471910574,
  1539241949,
  458788160,
  3436315007,
  1807016891,
  3718408830,
  978976581,
  1043663428,
  3165965781,
  1927990952,
  4200891579,
  2372276910,
  3208408903,
  3533431907,
  1412390302,
  2931980059,
  4132332400,
  1947078029,
  3881505623,
  4168226417,
  2941484381,
  1077988104,
  1320477388,
  886195818,
  18198404,
  3786409e3,
  2509781533,
  112762804,
  3463356488,
  1866414978,
  891333506,
  18488651,
  661792760,
  1628790961,
  3885187036,
  3141171499,
  876946877,
  2693282273,
  1372485963,
  791857591,
  2686433993,
  3759982718,
  3167212022,
  3472953795,
  2716379847,
  445679433,
  3561995674,
  3504004811,
  3574258232,
  54117162,
  3331405415,
  2381918588,
  3769707343,
  4154350007,
  1140177722,
  4074052095,
  668550556,
  3214352940,
  367459370,
  261225585,
  2610173221,
  4209349473,
  3468074219,
  3265815641,
  314222801,
  3066103646,
  3808782860,
  282218597,
  3406013506,
  3773591054,
  379116347,
  1285071038,
  846784868,
  2669647154,
  3771962079,
  3550491691,
  2305946142,
  453669953,
  1268987020,
  3317592352,
  3279303384,
  3744833421,
  2610507566,
  3859509063,
  266596637,
  3847019092,
  517658769,
  3462560207,
  3443424879,
  370717030,
  4247526661,
  2224018117,
  4143653529,
  4112773975,
  2788324899,
  2477274417,
  1456262402,
  2901442914,
  1517677493,
  1846949527,
  2295493580,
  3734397586,
  2176403920,
  1280348187,
  1908823572,
  3871786941,
  846861322,
  1172426758,
  3287448474,
  3383383037,
  1655181056,
  3139813346,
  901632758,
  1897031941,
  2986607138,
  3066810236,
  3447102507,
  1393639104,
  373351379,
  950779232,
  625454576,
  3124240540,
  4148612726,
  2007998917,
  544563296,
  2244738638,
  2330496472,
  2058025392,
  1291430526,
  424198748,
  50039436,
  29584100,
  3605783033,
  2429876329,
  2791104160,
  1057563949,
  3255363231,
  3075367218,
  3463963227,
  1469046755,
  985887462
];
var C_ORIG = [
  1332899944,
  1700884034,
  1701343084,
  1684370003,
  1668446532,
  1869963892
];
function _encipher(lr, off, P, S) {
  var n, l = lr[off], r = lr[off + 1];
  l ^= P[0];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[1];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[2];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[3];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[4];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[5];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[6];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[7];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[8];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[9];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[10];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[11];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[12];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[13];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[14];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[15];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[16];
  lr[off] = r ^ P[BLOWFISH_NUM_ROUNDS + 1];
  lr[off + 1] = l;
  return lr;
}
function _streamtoword(data, offp) {
  for (var i = 0, word = 0; i < 4; ++i)
    word = word << 8 | data[offp] & 255, offp = (offp + 1) % data.length;
  return { key: word, offp };
}
function _key(key, P, S) {
  var offset = 0, lr = [0, 0], plen = P.length, slen = S.length, sw;
  for (var i = 0; i < plen; i++)
    sw = _streamtoword(key, offset), offset = sw.offp, P[i] = P[i] ^ sw.key;
  for (i = 0; i < plen; i += 2)
    lr = _encipher(lr, 0, P, S), P[i] = lr[0], P[i + 1] = lr[1];
  for (i = 0; i < slen; i += 2)
    lr = _encipher(lr, 0, P, S), S[i] = lr[0], S[i + 1] = lr[1];
}
function _ekskey(data, key, P, S) {
  var offp = 0, lr = [0, 0], plen = P.length, slen = S.length, sw;
  for (var i = 0; i < plen; i++)
    sw = _streamtoword(key, offp), offp = sw.offp, P[i] = P[i] ^ sw.key;
  offp = 0;
  for (i = 0; i < plen; i += 2)
    sw = _streamtoword(data, offp), offp = sw.offp, lr[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr[1] ^= sw.key, lr = _encipher(lr, 0, P, S), P[i] = lr[0], P[i + 1] = lr[1];
  for (i = 0; i < slen; i += 2)
    sw = _streamtoword(data, offp), offp = sw.offp, lr[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr[1] ^= sw.key, lr = _encipher(lr, 0, P, S), S[i] = lr[0], S[i + 1] = lr[1];
}
function _crypt(b, salt, rounds, callback, progressCallback) {
  var cdata = C_ORIG.slice(), clen = cdata.length, err;
  if (rounds < 4 || rounds > 31) {
    err = Error("Illegal number of rounds (4-31): " + rounds);
    if (callback) {
      nextTick(callback.bind(this, err));
      return;
    } else throw err;
  }
  if (salt.length !== BCRYPT_SALT_LEN) {
    err = Error(
      "Illegal salt length: " + salt.length + " != " + BCRYPT_SALT_LEN
    );
    if (callback) {
      nextTick(callback.bind(this, err));
      return;
    } else throw err;
  }
  rounds = 1 << rounds >>> 0;
  var P, S, i = 0, j;
  if (typeof Int32Array === "function") {
    P = new Int32Array(P_ORIG);
    S = new Int32Array(S_ORIG);
  } else {
    P = P_ORIG.slice();
    S = S_ORIG.slice();
  }
  _ekskey(salt, b, P, S);
  function next() {
    if (progressCallback) progressCallback(i / rounds);
    if (i < rounds) {
      var start = Date.now();
      for (; i < rounds; ) {
        i = i + 1;
        _key(b, P, S);
        _key(salt, P, S);
        if (Date.now() - start > MAX_EXECUTION_TIME) break;
      }
    } else {
      for (i = 0; i < 64; i++)
        for (j = 0; j < clen >> 1; j++) _encipher(cdata, j << 1, P, S);
      var ret = [];
      for (i = 0; i < clen; i++)
        ret.push((cdata[i] >> 24 & 255) >>> 0), ret.push((cdata[i] >> 16 & 255) >>> 0), ret.push((cdata[i] >> 8 & 255) >>> 0), ret.push((cdata[i] & 255) >>> 0);
      if (callback) {
        callback(null, ret);
        return;
      } else return ret;
    }
    if (callback) nextTick(next);
  }
  if (typeof callback !== "undefined") {
    next();
  } else {
    var res;
    while (true) if (typeof (res = next()) !== "undefined") return res || [];
  }
}
function _hash(password2, salt, callback, progressCallback) {
  var err;
  if (typeof password2 !== "string" || typeof salt !== "string") {
    err = Error("Invalid string / salt: Not a string");
    if (callback) {
      nextTick(callback.bind(this, err));
      return;
    } else throw err;
  }
  var minor, offset;
  if (salt.charAt(0) !== "$" || salt.charAt(1) !== "2") {
    err = Error("Invalid salt version: " + salt.substring(0, 2));
    if (callback) {
      nextTick(callback.bind(this, err));
      return;
    } else throw err;
  }
  if (salt.charAt(2) === "$") minor = String.fromCharCode(0), offset = 3;
  else {
    minor = salt.charAt(2);
    if (minor !== "a" && minor !== "b" && minor !== "y" || salt.charAt(3) !== "$") {
      err = Error("Invalid salt revision: " + salt.substring(2, 4));
      if (callback) {
        nextTick(callback.bind(this, err));
        return;
      } else throw err;
    }
    offset = 4;
  }
  if (salt.charAt(offset + 2) > "$") {
    err = Error("Missing salt rounds");
    if (callback) {
      nextTick(callback.bind(this, err));
      return;
    } else throw err;
  }
  var r1 = parseInt(salt.substring(offset, offset + 1), 10) * 10, r2 = parseInt(salt.substring(offset + 1, offset + 2), 10), rounds = r1 + r2, real_salt = salt.substring(offset + 3, offset + 25);
  password2 += minor >= "a" ? "\0" : "";
  var passwordb = utf8Array(password2), saltb = base64_decode(real_salt, BCRYPT_SALT_LEN);
  function finish(bytes) {
    var res = [];
    res.push("$2");
    if (minor >= "a") res.push(minor);
    res.push("$");
    if (rounds < 10) res.push("0");
    res.push(rounds.toString());
    res.push("$");
    res.push(base64_encode(saltb, saltb.length));
    res.push(base64_encode(bytes, C_ORIG.length * 4 - 1));
    return res.join("");
  }
  if (typeof callback == "undefined")
    return finish(_crypt(passwordb, saltb, rounds));
  else {
    _crypt(
      passwordb,
      saltb,
      rounds,
      function(err2, bytes) {
        if (err2) callback(err2, null);
        else callback(null, finish(bytes));
      },
      progressCallback
    );
  }
}
function encodeBase64(bytes, length) {
  return base64_encode(bytes, length);
}
function decodeBase64(string, length) {
  return base64_decode(string, length);
}
var bcryptjs_default = {
  setRandomFallback,
  genSaltSync,
  genSalt,
  hashSync,
  hash,
  compareSync,
  compare,
  getRounds,
  getSalt,
  truncates,
  encodeBase64,
  decodeBase64
};

// server/seed.json
var seed_default = [
  {
    id: "boas-vindas",
    kind: "module",
    status: "published",
    body: {
      title: "Comece por aqui",
      symbol: "\u2726",
      category: "BOAS-VINDAS",
      description: "Conhe\xE7a a plataforma e escolha por onde come\xE7ar a planejar sua vida na It\xE1lia.",
      order: 0
    }
  },
  {
    id: "boas-vindas-0",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Sua jornada come\xE7a aqui",
      moduleId: "boas-vindas",
      order: 0,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "boas-vindas-1",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Como usar as trilhas",
      moduleId: "boas-vindas",
      order: 1,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "caminhos",
    kind: "module",
    status: "published",
    body: {
      title: "Caminhos da cidadania",
      symbol: "\u2318",
      category: "CIDADANIA ITALIANA",
      description: "Uma introdu\xE7\xE3o aos temas que precisam ser avaliados antes de escolher uma via de reconhecimento.",
      order: 3
    }
  },
  {
    id: "caminhos-0",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Entenda seu ponto de partida",
      moduleId: "caminhos",
      order: 0,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "caminhos-1",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Conhe\xE7a as vias de reconhecimento",
      moduleId: "caminhos",
      order: 1,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "genealogia",
    kind: "module",
    status: "published",
    body: {
      title: "Sua hist\xF3ria familiar",
      symbol: "\u2667",
      category: "DOCUMENTA\xC7\xC3O",
      description: "Organize as informa\xE7\xF5es da sua fam\xEDlia e prepare sua pesquisa documental.",
      order: 6
    }
  },
  {
    id: "genealogia-0",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Organizando a linha familiar",
      moduleId: "genealogia",
      order: 0,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "genealogia-1",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Fontes para pesquisa",
      moduleId: "genealogia",
      order: 1,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "certidoes",
    kind: "module",
    status: "published",
    body: {
      title: "Certid\xF5es e documentos",
      symbol: "\u25A4",
      category: "DOCUMENTA\xC7\xC3O",
      description: "Conhe\xE7a o planejamento de uma pasta documental e os pontos a conferir.",
      order: 9
    }
  },
  {
    id: "certidoes-0",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Organiza\xE7\xE3o do acervo",
      moduleId: "certidoes",
      order: 0,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "certidoes-1",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Confer\xEAncia das informa\xE7\xF5es",
      moduleId: "certidoes",
      order: 1,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "traducao",
    kind: "module",
    status: "published",
    body: {
      title: "Tradu\xE7\xF5es e apostilas",
      symbol: "\u6587",
      category: "DOCUMENTA\xC7\xC3O",
      description: "Entenda os temas de tradu\xE7\xE3o e autentica\xE7\xE3o que fazem parte do planejamento.",
      order: 12
    }
  },
  {
    id: "traducao-0",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Preparando os documentos",
      moduleId: "traducao",
      order: 0,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "traducao-1",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Tradu\xE7\xF5es e apostilamento",
      moduleId: "traducao",
      order: 1,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "consular",
    kind: "module",
    status: "published",
    body: {
      title: "Via consular",
      symbol: "\u2302",
      category: "CIDADANIA ITALIANA",
      description: "Conhe\xE7a a estrutura do caminho consular para quem est\xE1 no Brasil.",
      order: 15
    }
  },
  {
    id: "consular-0",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Vis\xE3o geral da via consular",
      moduleId: "consular",
      order: 0,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "consular-1",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Preparando o acompanhamento",
      moduleId: "consular",
      order: 1,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "judicial",
    kind: "module",
    status: "published",
    body: {
      title: "Via judicial",
      symbol: "\u2696",
      category: "CIDADANIA ITALIANA",
      description: "Entenda os temas envolvidos em um processo judicial e na escolha de acompanhamento profissional.",
      order: 18
    }
  },
  {
    id: "judicial-0",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Vis\xE3o geral da via judicial",
      moduleId: "judicial",
      order: 0,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "judicial-1",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Documentos e acompanhamento",
      moduleId: "judicial",
      order: 1,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "administrativa",
    kind: "module",
    status: "published",
    body: {
      title: "Reconhecimento na It\xE1lia",
      symbol: "\u25C7",
      category: "CIDADANIA ITALIANA",
      description: "Conhe\xE7a os temas de reconhecimento na It\xE1lia e sua rela\xE7\xE3o com o planejamento da mudan\xE7a.",
      order: 21
    }
  },
  {
    id: "administrativa-0",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Vis\xE3o geral da via administrativa",
      moduleId: "administrativa",
      order: 0,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "administrativa-1",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Planejamento da estadia",
      moduleId: "administrativa",
      order: 1,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "aire",
    kind: "module",
    status: "published",
    body: {
      title: "AIRE e vida no exterior",
      symbol: "\u25CE",
      category: "AP\xD3S O RECONHECIMENTO",
      description: "Prepare-se para aprender sobre cadastro e manuten\xE7\xE3o de informa\xE7\xF5es de resid\xEAncia no exterior.",
      order: 24
    }
  },
  {
    id: "aire-0",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Conhecendo o AIRE",
      moduleId: "aire",
      order: 0,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "aire-1",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Organizando suas atualiza\xE7\xF5es",
      moduleId: "aire",
      order: 1,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "passaporte",
    kind: "module",
    status: "published",
    body: {
      title: "Passaporte italiano",
      symbol: "\u25A3",
      category: "AP\xD3S O RECONHECIMENTO",
      description: "Uma introdu\xE7\xE3o \xE0 organiza\xE7\xE3o para solicitar documentos ap\xF3s o reconhecimento.",
      order: 27
    }
  },
  {
    id: "passaporte-0",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Planejamento da solicita\xE7\xE3o",
      moduleId: "passaporte",
      order: 0,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "passaporte-1",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Organizando os pr\xF3ximos passos",
      moduleId: "passaporte",
      order: 1,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "regioes",
    kind: "module",
    status: "published",
    body: {
      title: "Onde morar na It\xE1lia?",
      symbol: "\u2316",
      category: "PLANEJE SUA MUDAN\xC7A",
      description: "Defina suas prioridades: rotina, clima, mobilidade, trabalho e proximidade da sua rede de apoio.",
      order: 30
    }
  },
  {
    id: "regioes-0",
    kind: "lesson",
    status: "draft",
    body: {
      title: "O que importa para sua escolha",
      moduleId: "regioes",
      order: 0,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "regioes-1",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Comparando regi\xF5es e cidades",
      moduleId: "regioes",
      order: 1,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "orcamento",
    kind: "module",
    status: "published",
    body: {
      title: "Planejamento financeiro",
      symbol: "\u20AC",
      category: "PLANEJE SUA MUDAN\xC7A",
      description: "Organize as categorias de custos para elaborar seu pr\xF3prio plano de mudan\xE7a.",
      order: 33
    }
  },
  {
    id: "orcamento-0",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Categorias do or\xE7amento",
      moduleId: "orcamento",
      order: 0,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "orcamento-1",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Construindo uma reserva",
      moduleId: "orcamento",
      order: 1,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "moradia",
    kind: "module",
    status: "published",
    body: {
      title: "Encontrando seu lar",
      symbol: "\u2302",
      category: "CHEGADA \xC0 IT\xC1LIA",
      description: "Prepare sua busca por moradia a partir das necessidades da sua fam\xEDlia.",
      order: 36
    }
  },
  {
    id: "moradia-0",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Preparando a busca por moradia",
      moduleId: "moradia",
      order: 0,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "moradia-1",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Pontos para avaliar em um im\xF3vel",
      moduleId: "moradia",
      order: 1,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "documentos",
    kind: "module",
    status: "published",
    body: {
      title: "Documentos para a chegada",
      symbol: "\u25A4",
      category: "CHEGADA \xC0 IT\xC1LIA",
      description: "Conhe\xE7a os temas documentais que precisam entrar no seu planejamento.",
      order: 39
    }
  },
  {
    id: "documentos-0",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Sua pasta de viagem",
      moduleId: "documentos",
      order: 0,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "documentos-1",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Organizando a chegada",
      moduleId: "documentos",
      order: 1,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "pets",
    kind: "module",
    status: "published",
    body: {
      title: "Meu pet vai comigo",
      symbol: "\u2661",
      category: "CHEGADA \xC0 IT\xC1LIA",
      description: "Organize o planejamento da viagem e a adapta\xE7\xE3o do seu animal de estima\xE7\xE3o.",
      order: 42
    }
  },
  {
    id: "pets-0",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Planejando a viagem do pet",
      moduleId: "pets",
      order: 0,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "pets-1",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Prepara\xE7\xE3o e transporte",
      moduleId: "pets",
      order: 1,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "residencia",
    kind: "module",
    status: "published",
    body: {
      title: "Resid\xEAncia na It\xE1lia",
      symbol: "\u2316",
      category: "VIDA NA IT\xC1LIA",
      description: "Conhe\xE7a os temas de registro de resid\xEAncia que fazem parte da chegada.",
      order: 45
    }
  },
  {
    id: "residencia-0",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Introdu\xE7\xE3o \xE0 resid\xEAncia",
      moduleId: "residencia",
      order: 0,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "residencia-1",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Organiza\xE7\xE3o dos pr\xF3ximos passos",
      moduleId: "residencia",
      order: 1,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "permesso",
    kind: "module",
    status: "published",
    body: {
      title: "Permesso e fam\xEDlia",
      symbol: "\u25A3",
      category: "VIDA NA IT\xC1LIA",
      description: "Prepare-se para estudar as quest\xF5es de perman\xEAncia e documenta\xE7\xE3o familiar.",
      order: 48
    }
  },
  {
    id: "permesso-0",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Ponto de partida da fam\xEDlia",
      moduleId: "permesso",
      order: 0,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "permesso-1",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Temas de perman\xEAncia e documenta\xE7\xE3o",
      moduleId: "permesso",
      order: 1,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "identidade",
    kind: "module",
    status: "published",
    body: {
      title: "Identidade italiana",
      symbol: "\u25A4",
      category: "VIDA NA IT\xC1LIA",
      description: "Conhe\xE7a os temas de identidade e organiza\xE7\xE3o documental na It\xE1lia.",
      order: 51
    }
  },
  {
    id: "identidade-0",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Conhecendo a CIE",
      moduleId: "identidade",
      order: 0,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "identidade-1",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Planejando seus documentos",
      moduleId: "identidade",
      order: 1,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "italiano",
    kind: "module",
    status: "published",
    body: {
      title: "Italiano para o dia a dia",
      symbol: "Ciao",
      category: "SEU NOVO CAP\xCDTULO",
      description: "Planeje o aprendizado do idioma para situa\xE7\xF5es da vida cotidiana.",
      order: 54
    }
  },
  {
    id: "italiano-0",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Primeiras intera\xE7\xF5es",
      moduleId: "italiano",
      order: 0,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "italiano-1",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Construindo uma rotina de estudo",
      moduleId: "italiano",
      order: 1,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "trabalho",
    kind: "module",
    status: "published",
    body: {
      title: "Trabalhar na It\xE1lia",
      symbol: "\u2197",
      category: "TRABALHO E FORMA\xC7\xC3O",
      description: "Organize sua trajet\xF3ria profissional e prepare uma estrat\xE9gia de busca por trabalho.",
      order: 57
    }
  },
  {
    id: "trabalho-0",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Seu plano profissional",
      moduleId: "trabalho",
      order: 0,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "trabalho-1",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Curr\xEDculo e busca por oportunidades",
      moduleId: "trabalho",
      order: 1,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "diploma",
    kind: "module",
    status: "published",
    body: {
      title: "Diplomas e profiss\xF5es",
      symbol: "\u25C7",
      category: "TRABALHO E FORMA\xC7\xC3O",
      description: "Mapeie os temas de reconhecimento de forma\xE7\xE3o relacionados \xE0 sua \xE1rea de atua\xE7\xE3o.",
      order: 60
    }
  },
  {
    id: "diploma-0",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Sua forma\xE7\xE3o e seus objetivos",
      moduleId: "diploma",
      order: 0,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "diploma-1",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Temas de reconhecimento profissional",
      moduleId: "diploma",
      order: 1,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "escola",
    kind: "module",
    status: "published",
    body: {
      title: "Escola e adapta\xE7\xE3o",
      symbol: "\u25B1",
      category: "VIDA EM FAM\xCDLIA",
      description: "Prepare a fam\xEDlia para conversar sobre escola, idioma e adapta\xE7\xE3o.",
      order: 63
    }
  },
  {
    id: "escola-0",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Planejando os estudos dos filhos",
      moduleId: "escola",
      order: 0,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "escola-1",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Adapta\xE7\xE3o escolar",
      moduleId: "escola",
      order: 1,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "saude",
    kind: "module",
    status: "published",
    body: {
      title: "Sa\xFAde e bem-estar",
      symbol: "+",
      category: "VIDA EM FAM\xCDLIA",
      description: "Inclua os cuidados de sa\xFAde e bem-estar no planejamento da mudan\xE7a.",
      order: 66
    }
  },
  {
    id: "saude-0",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Planejamento dos cuidados",
      moduleId: "saude",
      order: 0,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "saude-1",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Organizando informa\xE7\xF5es de sa\xFAde",
      moduleId: "saude",
      order: 1,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "comunidade",
    kind: "module",
    status: "published",
    body: {
      title: "Uma nova rotina",
      symbol: "\u2661",
      category: "VIDA EM FAM\xCDLIA",
      description: "Pense em formas de criar v\xEDnculos e organizar uma rotina no novo pa\xEDs.",
      order: 69
    }
  },
  {
    id: "comunidade-0",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Sua rede de apoio",
      moduleId: "comunidade",
      order: 0,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "comunidade-1",
    kind: "lesson",
    status: "draft",
    body: {
      title: "Construindo novos v\xEDnculos",
      moduleId: "comunidade",
      order: 1,
      description: "",
      videoUrl: "",
      duration: 0,
      tasks: []
    }
  },
  {
    id: "cidadania",
    kind: "track",
    status: "published",
    body: {
      id: "cidadania",
      name: "Reconhecer minha cidadania",
      tag: "DA ORIGEM AO RECONHECIMENTO",
      description: "Entenda os caminhos poss\xEDveis e organize cada etapa da sua jornada de cidadania italiana.",
      groups: [
        [
          "Seu ponto de partida",
          [
            "boas-vindas",
            "caminhos"
          ]
        ],
        [
          "Prepare sua documenta\xE7\xE3o",
          [
            "genealogia",
            "certidoes",
            "traducao"
          ]
        ],
        [
          "Conhe\xE7a as vias de reconhecimento",
          [
            "consular",
            "judicial",
            "administrativa"
          ]
        ],
        [
          "Depois do reconhecimento",
          [
            "aire",
            "passaporte"
          ]
        ]
      ],
      title: "Reconhecer minha cidadania",
      order: 0
    }
  },
  {
    id: "mudanca",
    kind: "track",
    status: "published",
    body: {
      id: "mudanca",
      name: "Planejar minha mudan\xE7a",
      tag: "DO BRASIL \xC0 IT\xC1LIA",
      description: "Prepare sua chegada: regi\xE3o, moradia, documenta\xE7\xE3o e os primeiros passos em um novo pa\xEDs.",
      groups: [
        [
          "Planejamento da mudan\xE7a",
          [
            "boas-vindas",
            "regioes",
            "orcamento"
          ]
        ],
        [
          "Organize sua chegada",
          [
            "moradia",
            "documentos",
            "pets"
          ]
        ],
        [
          "Estabele\xE7a sua resid\xEAncia",
          [
            "residencia",
            "permesso",
            "identidade"
          ]
        ]
      ],
      title: "Planejar minha mudan\xE7a",
      order: 1
    }
  },
  {
    id: "vida",
    kind: "track",
    status: "published",
    body: {
      id: "vida",
      name: "Construir minha vida na It\xE1lia",
      tag: "SEU NOVO CAP\xCDTULO",
      description: "Explore trabalho, estudos e vida em fam\xEDlia para construir sua rotina na It\xE1lia.",
      groups: [
        [
          "Prepare seu novo come\xE7o",
          [
            "boas-vindas",
            "italiano"
          ]
        ],
        [
          "Trabalho e forma\xE7\xE3o",
          [
            "trabalho",
            "diploma"
          ]
        ],
        [
          "Vida em fam\xEDlia",
          [
            "escola",
            "saude",
            "comunidade"
          ]
        ]
      ],
      title: "Construir minha vida na It\xE1lia",
      order: 2
    }
  }
];

// server/assets.generated.js
var assets_generated_default = { "/app.js": { "body": `const main=document.querySelector('main');
const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let user=null,records=[],learning={},adminRecords=[],authSetup=false,routeVersion=0;
const order=(a,b)=>(a.order||0)-(b.order||0)||a.title.localeCompare(b.title,'pt-BR');
const byKind=k=>records.filter(r=>r.kind===k).sort(order);
const statusName={published:'Publicado',draft:'Rascunho',archived:'Arquivado',active:'Ativo',suspended:'Suspenso',open:'Aberta',answered:'Respondida'};
const badge=s=>\`<span class="status \${h(s)}">\${h(statusName[s]||s)}</span>\`;
const date=s=>new Date(s).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});
const goto=path=>{location.hash=path;};
function toast(s){const t=document.querySelector('#toast');t.textContent=s;t.style.display='block';clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>t.style.display='none',4500);}
async function api(path,method='GET',data){const res=await fetch('/api'+path,{method,credentials:'same-origin',headers:method==='GET'?{}:{'Content-Type':'application/json','X-Partiu-Request':'1'},body:data===undefined?undefined:JSON.stringify(data)});let b;try{b=await res.json();}catch{throw new Error('N\xE3o foi poss\xEDvel conectar. Tente novamente.');}if(!res.ok){const e=new Error(b.error||'N\xE3o foi poss\xEDvel concluir.');e.status=res.status;throw e;}return b;}
function attachForm(id,callback){const form=document.getElementById(id);form.onsubmit=async e=>{e.preventDefault();const error=form.querySelector('.form-error');error.textContent='';const submit=form.querySelector('[type=submit]');submit.disabled=true;try{await callback(Object.fromEntries(new FormData(form)),form);}catch(err){error.textContent=err.message;}finally{if(submit.isConnected)submit.disabled=false;}};}
const field=(label,name,value='',type='text',required=false)=>\`<label>\${h(label)}<input name="\${h(name)}" type="\${type}" value="\${h(value)}" \${required?'required':''} \${type==='password'?'minlength="12" maxlength="72" autocomplete="new-password"':''}></label>\`;
const area=(label,name,value='')=>\`<label>\${h(label)}<textarea name="\${h(name)}">\${h(value)}</textarea></label>\`;
const errorBox='<p class="form-error" role="alert"></p>';
const select=(label,name,options,value)=>\`<label>\${h(label)}<select name="\${h(name)}">\${options.map(([v,t])=>\`<option value="\${h(v)}" \${v===value?'selected':''}>\${h(t)}</option>\`).join('')}</select></label>\`;
function frame(){document.querySelector('header .preview-label')?.remove();document.querySelector('header .avatar')?.remove();let account=document.querySelector('.account-nav');if(!account){account=document.createElement('div');account.className='account-nav';document.querySelector('header').append(account);}account.innerHTML=user?\`\${user.role==='admin'?'<a href="#admin">Administra\xE7\xE3o</a>':''}<a class="avatar" href="#perfil">\${h(user.name.split(' ')[0])}</a><button id="logout">Sair</button>\`:'';document.querySelector('#logout')?.addEventListener('click',async()=>{try{await api('/auth/logout','POST',{});user=null;records=[];learning={};goto('entrar');render();}catch(e){toast(e.message);}});document.querySelector('.journeybar').classList.toggle('hidden',!user);document.querySelector('header nav').classList.toggle('hidden',!user);document.querySelector('footer small').textContent='Arrivo In It\xE1lia \xB7 \xC1rea de aprendizado';if(user)updateBar();}
function updateBar(){const active=byKind('track').find(t=>learning['active:track']===t.id)||byKind('track')[0];document.querySelector('#active-name').textContent=active?.title||'Explore os conte\xFAdos';document.querySelector('.active-path').href=active?'#trilha/'+active.id:'#inicio';const complete=byKind('lesson').filter(l=>learning['complete:'+l.id]===true).length;document.querySelector('#xp-count').textContent=complete*10+' XP';document.querySelector('#xp').value=complete*10%100;}
let navigationRegistered=false;
async function loadCatalog(){const [c,l]=await Promise.all([api('/catalog'),api('/learner')]);records=c.records;learning=l.data;if(!navigationRegistered&&document.modelContext?.registerTool){navigationRegistered=true;try{await document.modelContext.registerTool({name:'open_learning_path',title:'Abrir trilha de aprendizado',description:'Abre uma trilha publicada dispon\xEDvel na conta atual, sem alterar o progresso.',inputSchema:{type:'object',properties:{path:{type:'string'}},required:['path'],additionalProperties:false},annotations:{readOnlyHint:false},execute:async input=>{if(!user||!input||!records.some(t=>t.kind==='track'&&t.id===input.path))throw new Error('Trilha indispon\xEDvel');goto('trilha/'+input.path);await render();return{path:input.path};}});}catch{navigationRegistered=false;}}}
async function saveLearner(key,value){await api('/learner','PUT',{key,value});learning[key]=value;updateBar();}
function progress(ids){const ls=byKind('lesson').filter(l=>ids.includes(l.moduleId));return{total:ls.length,done:ls.filter(l=>learning['complete:'+l.id]===true).length,percent:ls.length?Math.round(ls.filter(l=>learning['complete:'+l.id]===true).length/ls.length*100):0};}
function poster(m){const ls=byKind('lesson').filter(l=>l.moduleId===m.id);return \`<a href="#modulo/\${h(m.id)}" class="poster \${m.id==='regioes'?'poster-photo':''}"><span>\${h(m.category)}</span><div class="course-symbol" aria-hidden="true">\${h(m.symbol||'\u25C7')}</div><div class="poster-copy"><small>\${ls.length?'DISPON\xCDVEL':'EM PRODU\xC7\xC3O'}</small><h3>\${h(m.title)}</h3><small>\${ls.length?ls.length+' aulas dispon\xEDveis':'Conte\xFAdo em prepara\xE7\xE3o'}</small></div></a>\`;}
function home(){const tracks=byKind('track'),modules=byKind('module');const recent=byKind('lesson').filter(l=>learning['history:'+l.id]).sort((a,b)=>Number(learning['history:'+b.id])-Number(learning['history:'+a.id]))[0];const groups=[...new Set(modules.map(m=>m.category))];main.innerHTML=\`<div class="container"><section class="hero"><span class="eyebrow">CONHECIMENTO PARA IR MAIS LONGE</span><h1>Seu pr\xF3ximo cap\xEDtulo<br>come\xE7a na It\xE1lia.</h1><p>Da descoberta das suas ra\xEDzes \xE0 constru\xE7\xE3o de uma nova vida.<br>Encontre o caminho que faz sentido para voc\xEA.</p><span class="hero-stamp">Benvenuto, \${h(user.name.split(' ')[0])}</span></section><form class="searchbar" role="search"><span>\u2315</span><input id="search" aria-label="Buscar trilhas e assuntos" placeholder="O que voc\xEA quer aprender hoje?"><button aria-label="Buscar">\u2192</button></form><div id="search-results" class="hidden"></div><div id="home-content">\${recent?\`<div class="section-title"><h2>Continue assistindo</h2></div><section class="resume"><span class="play-small">\u25B7</span><div><h3>\${h(recent.title)}</h3><p>Retome sua jornada de aprendizado.</p></div><a class="primary" href="#aula/\${h(recent.id)}">Continuar \u2192</a></section>\`:''}<div class="section-title"><div><h2>Qual \xE9 o seu pr\xF3ximo destino?</h2><p>Trilhas de conhecimento para cada momento da sua jornada.</p></div><span class="muted">\${tracks.length} trilhas</span></div><section class="tracks">\${tracks.map((t,i)=>{const p=progress(t.groups.flatMap(g=>g[1]));return \`<a href="#trilha/\${h(t.id)}" class="track"><div class="topline"><span>TRILHA \${i+1}</span><span class="pill">\${t.groups.flatMap(g=>g[1]).length} m\xF3dulos</span></div><div class="track-info"><h3>\${h(t.title)}</h3><p>\${h(t.description)}</p><div class="track-link"><span>Acessar trilha \u2192</span><span>\${p.percent}%</span></div></div></a>\`;}).join('')}</section>\${groups.map(cat=>\`<details class="catalog" open><summary>\${h(cat)}</summary><div class="poster-grid">\${modules.filter(m=>m.category===cat).map(poster).join('')}</div></details>\`).join('')}\${!modules.length?'<div class="empty"><h2>Seu conte\xFAdo est\xE1 a caminho</h2><p>Os m\xF3dulos aparecer\xE3o aqui conforme forem publicados.</p></div>':''}</div></div>\`;const input=document.querySelector('#search');const search=()=>{const normalize=s=>s.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();const q=normalize(input.value.trim());document.querySelector('#home-content').classList.toggle('hidden',!!q);const box=document.querySelector('#search-results');box.classList.toggle('hidden',!q);const result=modules.filter(m=>normalize(m.title+' '+m.category).includes(q));box.innerHTML=\`<div class="section-title"><h2>\${result.length} assuntos encontrados</h2></div><div class="poster-grid">\${result.map(poster).join('')}</div>\`;};input.oninput=search;document.querySelector('.searchbar').onsubmit=e=>{e.preventDefault();search();};}
function trail(id){const t=records.find(r=>r.id===id&&r.kind==='track');if(!t)return notfound();const p=progress(t.groups.flatMap(g=>g[1]));main.innerHTML=\`<div class="container narrow"><a class="back" href="#inicio">\u2190 Voltar ao in\xEDcio</a><section class="hero track-hero"><span class="eyebrow">\${h(t.tag)}</span><h1>\${h(t.title)}</h1><p>\${h(t.description)}</p></section><div class="path-head"><div><h2>Seu caminho de aprendizado</h2><small>\${p.done} de \${p.total} aulas conclu\xEDdas \xB7 \${p.percent}%</small></div><button class="outline" id="activate">\${learning['active:track']===id?'\u2713 Trilha selecionada':'Selecionar trilha'}</button></div><progress max="100" value="\${p.percent}" aria-label="Progresso da trilha"></progress><div class="path">\${t.groups.map(([title,ids])=>\`<section class="stage"><h2>\${h(title)}</h2><div class="nodes">\${ids.map(mid=>{const m=records.find(r=>r.id===mid);if(!m)return '';const p=progress([mid]);return \`<a class="node \${p.percent===100?'done':p.total?'current':''}" href="#modulo/\${h(mid)}"><span class="node-circle">\${p.percent===100?'\u2713':p.total?'\u25B7':'\u25C7'}</span><strong>\${h(m.title)}</strong><small>\${p.total?p.percent+'% conclu\xEDdo':'Em produ\xE7\xE3o'}</small></a>\`;}).join('')}</div></section>\`).join('')}</div></div>\`;document.querySelector('#activate').onclick=async e=>{try{await saveLearner('active:track',id);e.target.textContent='\u2713 Trilha selecionada';toast('Trilha salva na sua conta.');}catch(err){toast(err.message);}};}
function modulePage(id){const m=records.find(r=>r.id===id&&r.kind==='module');if(!m)return notfound();const ls=byKind('lesson').filter(l=>l.moduleId===id);main.innerHTML=\`<div class="container narrow"><a class="back" href="#inicio">\u2190 Voltar ao cat\xE1logo</a><span class="eyebrow">\${h(m.category)}</span><h1 class="page-title">\${h(m.title)}</h1><p class="description">\${h(m.description)}</p><button id="favorite" class="outline">\${learning['favorite:'+id]?'\u2605 Remover dos favoritos':'\u2606 Salvar nos favoritos'}</button>\${ls.length?\`<div class="section-title"><h2>Aulas do m\xF3dulo</h2></div><div class="table-wrap">\${ls.map(l=>\`<a class="lesson-row" href="#aula/\${h(l.id)}"><span>\${learning['complete:'+l.id]?'\u2713':'\u25B7'}</span><span>\${h(l.title)}<small>\${l.duration?l.duration+' min':'Videoaula'}</small></span></a>\`).join('')}</div>\`:'<div class="empty"><span class="empty-icon">\u25B7</span><h2>Videoaulas em produ\xE7\xE3o</h2><p>As aulas deste m\xF3dulo aparecer\xE3o aqui assim que forem publicadas.</p></div>'}</div>\`;document.querySelector('#favorite').onclick=async()=>{try{await saveLearner('favorite:'+id,!learning['favorite:'+id]);modulePage(id);}catch(e){toast(e.message);}};}
async function lesson(id,preview=false){if(preview&&user.role!=='admin')return notfound();const source=preview?adminRecords:records;const l=source.find(r=>r.id===id&&r.kind==='lesson');if(!l)return notfound();const m=source.find(r=>r.id===l.moduleId);if(!m)return notfound();const lessons=source.filter(r=>r.kind==='lesson'&&r.moduleId===m.id&&(preview||r.status==='published')).sort(order);const p=progress([m.id]);main.innerHTML=\`<div class="lesson-layout"><article class="lesson-main"><div class="crumb"><a href="#inicio">In\xEDcio</a> \u203A <a href="#modulo/\${h(m.id)}">\${h(m.title)}</a></div>\${preview?'<div class="admin-notice">Pr\xE9via administrativa \xB7 altera\xE7\xF5es de progresso desativadas. <a href="#admin/lesson">Voltar \xE0 administra\xE7\xE3o</a></div>':''}<span class="eyebrow">\${h(m.category)}</span><h1>\${h(l.title)}</h1><p class="description plaincopy">\${h(l.description)}</p>\${l.video?.type==='iframe'?\`<iframe class="video-player" src="\${h(l.video.url)}" title="\${h(l.title)}" allow="fullscreen; picture-in-picture" allowfullscreen></iframe>\`:l.video?.type==='video'?\`<video class="video-player" src="\${h(l.video.url)}" controls preload="metadata"></video>\`:'<div class="video-empty"><span>\u25B7</span><h2>V\xEDdeo em prepara\xE7\xE3o</h2><p>O v\xEDdeo ainda n\xE3o foi cadastrado.</p></div>'}\${!preview?\`<div class="completion"><button id="complete" class="\${learning['complete:'+id]?'outline':'primary'}">\${learning['complete:'+id]?'\u2713 Conclu\xEDda \xB7 desfazer':'Marcar aula como conclu\xEDda'}</button><span class="save-state">Progresso salvo na sua conta</span></div><div class="tabs" role="tablist" aria-label="Recursos da aula">\${[['tasks','Tarefas'],['notes','Minhas anota\xE7\xF5es'],['questions','D\xFAvidas']].map(([v,t],i)=>\`<button role="tab" id="tab-\${v}" aria-controls="panel" data-tab="\${v}" aria-selected="\${i===0}" tabindex="\${i===0?0:-1}">\${t}</button>\`).join('')}</div><div id="panel" class="tabcontent" role="tabpanel"></div>\`:''}<div class="lesson-end"><a class="back" href="#modulo/\${h(m.id)}">\u2190 Ver m\xF3dulo</a>\${lessons[lessons.indexOf(l)+1]?\`<a class="outline" href="#\${preview?'preview':'aula'}/\${h(lessons[lessons.indexOf(l)+1].id)}">Pr\xF3xima aula \u2192</a>\`:''}</div></article><aside class="lesson-sidebar"><h2>\${h(m.title)}</h2><small>PROGRESSO DO M\xD3DULO</small><progress value="\${p.percent}" max="100" aria-label="Progresso do m\xF3dulo"></progress><p class="muted">\${p.done} de \${p.total} aulas conclu\xEDdas</p><details open><summary>AULAS</summary>\${lessons.map(a=>\`<a class="lesson-row \${a.id===id?'selected':''}" href="#\${preview?'preview':'aula'}/\${h(a.id)}">\${learning['complete:'+a.id]?'\u2713':'\u25B7'} <span>\${h(a.title)}<small>\${a.duration?a.duration+' min':''}\${preview?' \xB7 '+statusName[a.status]:''}</small></span></a>\`).join('')}</details></aside></div>\`;
 if(preview)return;saveLearner('history:'+id,Date.now()).catch(e=>toast(e.message));document.querySelector('#complete').onclick=async e=>{const btn=e.target;btn.disabled=true;try{await saveLearner('complete:'+id,!learning['complete:'+id]);await lesson(id);}catch(err){toast(err.message);btn.disabled=false;}};
 let tabVersion=0;async function tab(which){const version=++tabVersion;document.querySelectorAll('[data-tab]').forEach(b=>{b.setAttribute('aria-selected',String(b.dataset.tab===which));b.tabIndex=b.dataset.tab===which?0:-1;});const panel=document.querySelector('#panel');panel.setAttribute('aria-labelledby','tab-'+which);if(which==='tasks'){panel.innerHTML=l.tasks?.length?\`<h3>Coloque em pr\xE1tica</h3>\${l.tasks.map(t=>\`<label class="task"><input type="checkbox" data-task="\${h(t.id)}" \${learning['task:'+t.id]?'checked':''}><span>\${h(t.title)}</span></label>\`).join('')}\`:'<p class="muted">Esta aula n\xE3o tem tarefas complementares.</p>';panel.querySelectorAll('[data-task]').forEach(input=>input.onchange=async()=>{input.disabled=true;try{await saveLearner('task:'+input.dataset.task,input.checked);}catch(e){input.checked=!input.checked;toast(e.message);}finally{input.disabled=false;}});}else if(which==='notes'){panel.innerHTML=\`<form id="note-form" class="form">\${area('Minhas anota\xE7\xF5es','note',learning['note:'+id]||'')}<small>Estas anota\xE7\xF5es s\xE3o privadas e vinculadas \xE0 sua conta.</small>\${errorBox}<div><button type="submit" class="primary">Salvar anota\xE7\xF5es</button></div></form>\`;attachForm('note-form',async b=>{await saveLearner('note:'+id,b.note);toast('Anota\xE7\xF5es salvas.');});}else{panel.innerHTML='<p class="muted">Carregando suas d\xFAvidas\u2026</p>';try{const result=await api('/questions');if(version!==tabVersion||!panel.isConnected)return;panel.innerHTML=\`<form class="form" id="question-form">\${area('Envie sua d\xFAvida','text')}\${errorBox}<div><button type="submit" class="primary">Enviar d\xFAvida</button></div></form><h3>Minhas d\xFAvidas</h3>\${result.questions.filter(q=>q.lessonId===id).map(q=>\`<div class="question">\${h(q.text)}\${q.answer?\`<div class="answer"><strong>Resposta da equipe</strong><br>\${h(q.answer)}</div>\`:'<p class="muted">Aguardando resposta</p>'}</div>\`).join('')}\`;attachForm('question-form',async b=>{await api('/questions','POST',{lessonId:id,text:b.text});tab('questions');});}catch(e){panel.textContent=e.message;}}}
 document.querySelectorAll('[data-tab]').forEach((b,i)=>{b.onclick=()=>tab(b.dataset.tab);b.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const bs=[...document.querySelectorAll('[data-tab]')],n=e.key==='Home'?0:e.key==='End'?2:(i+(e.key==='ArrowRight'?1:2))%3;bs[n].focus();tab(bs[n].dataset.tab);};});tab('tasks');}
function collection(kind){let modules;if(kind==='favoritos')modules=byKind('module').filter(m=>learning['favorite:'+m.id]);else{const seen=byKind('lesson').filter(l=>learning['history:'+l.id]).sort((a,b)=>learning['history:'+b.id]-learning['history:'+a.id]);modules=[...new Set(seen.map(l=>l.moduleId))].map(id=>records.find(r=>r.id===id)).filter(Boolean);}main.innerHTML=\`<div class="container"><h1 class="page-title">\${kind==='favoritos'?'Favoritos':'Hist\xF3rico'}</h1><p class="muted">Seus conte\xFAdos, salvos na sua conta.</p>\${modules.length?\`<div class="poster-grid">\${modules.map(poster).join('')}</div>\`:'<div class="empty"><h2>Ainda n\xE3o h\xE1 conte\xFAdos aqui</h2><p>Explore os m\xF3dulos para come\xE7ar.</p><a class="primary" href="#inicio">Ver cat\xE1logo</a></div>'}</div>\`;}
function agenda(){main.innerHTML='<div class="container narrow"><h1 class="page-title">Agenda</h1><p class="muted">Encontros ao vivo e datas importantes. Hor\xE1rios no seu fuso local.</p><div class="tabs"><button id="upcoming" aria-pressed="true">Pr\xF3ximos</button><button id="past" aria-pressed="false">Passados</button></div><div id="events"></div></div>';const set=past=>{document.querySelector('#upcoming').setAttribute('aria-pressed',String(!past));document.querySelector('#past').setAttribute('aria-pressed',String(past));const events=byKind('event').filter(e=>(new Date(e.end)<new Date())===past).sort((a,b)=>past?Date.parse(b.start)-Date.parse(a.start):Date.parse(a.start)-Date.parse(b.start));document.querySelector('#events').innerHTML=events.length?events.map(e=>\`<article class="event-row"><div class="date">\${h(date(e.start))}</div><div><h2>\${h(e.title)}</h2><small>\${h(e.host)}</small><p class="muted plaincopy">\${h(e.description)}</p><p class="muted">\${h(e.location)}</p></div>\${e.joinUrl?\`<a class="outline" href="\${h(e.joinUrl)}" target="_blank" rel="noopener noreferrer">\${past?'Abrir link':'Acessar encontro'} \u2197</a>\`:''}</article>\`).join(''):'<div class="empty"><h2>Nenhum encontro neste per\xEDodo</h2><p>A programa\xE7\xE3o ser\xE1 atualizada pela equipe.</p></div>';};document.querySelector('#upcoming').onclick=()=>set(false);document.querySelector('#past').onclick=()=>set(true);set(false);}
function profile(){main.innerHTML=\`<div class="container narrow"><div class="profile-avatar">\${h(user.name.charAt(0))}</div><h1 class="page-title">Meu perfil</h1><p class="muted">\${h(user.email)} \xB7 \${user.role==='admin'?'Administrador':'Aluno'}</p><div class="profile-grid"><section class="editor"><h2>Seus dados</h2><form class="form" id="profile-form">\${field('Nome','name',user.name,'text',true)}\${errorBox}<button class="primary" type="submit">Salvar perfil</button></form></section><section class="editor"><h2>Alterar senha</h2><form class="form" id="password-form"><label>Senha atual<input type="password" name="current" autocomplete="current-password" required></label>\${field('Nova senha','password','','password',true)}<small>Pelo menos 12 caracteres. As outras sess\xF5es ser\xE3o encerradas.</small>\${errorBox}<button type="submit" class="primary">Alterar senha</button></form></section></div></div>\`;attachForm('profile-form',async b=>{await api('/profile','PUT',b);user=(await api('/auth/me')).user;frame();toast('Perfil atualizado.');});attachForm('password-form',async(b,form)=>{await api('/password','PUT',b);form.reset();toast('Senha alterada.');});}
function authPage(){const token=new URLSearchParams(location.hash.split('?')[1]||'').get('token');const mode=location.hash.startsWith('#ativar')?'activate':authSetup?'setup':'login';main.innerHTML=\`<div class="auth-shell"><a class="brandtext" href="#entrar">Arrivo In It\xE1lia \u2197</a><h1>\${mode==='setup'?'Configure sua conta administradora':mode==='activate'?'Defina seu acesso':'Bem-vindo de volta'}</h1><p class="muted">\${mode==='setup'?'Crie sua senha do Arrivo In It\xE1lia. Esta configura\xE7\xE3o inicial est\xE1 restrita ao propriet\xE1rio.':mode==='activate'?'Use o link recebido da administra\xE7\xE3o para definir sua senha.':'Entre na sua conta para continuar sua jornada.'}</p><form id="auth-form" class="form">\${mode==='login'?field('E-mail','email','','email',true):field('Seu nome','name','','text',true)}<label>Senha<input name="password" type="password" \${mode==='login'?'autocomplete="current-password"':'autocomplete="new-password" minlength="12" maxlength="72"'} required></label>\${mode!=='login'?'<small>Use pelo menos 12 caracteres e guarde sua senha em um local seguro.</small>':''}\${errorBox}<button class="primary" type="submit">\${mode==='login'?'Entrar':mode==='setup'?'Criar conta administradora':'Definir senha'}</button></form><p class="help">\${mode==='login'?'O acesso dos alunos \xE9 liberado pela administra\xE7\xE3o. Para recuperar a senha, solicite um novo link \xE0 equipe.':'O link de acesso \xE9 pessoal e n\xE3o deve ser compartilhado.'}</p></div>\`;attachForm('auth-form',async b=>{const result=await api('/auth/'+mode,'POST',mode==='activate'?{...b,token}:b);if(mode==='activate'){authSetup=false;goto('entrar');toast('Senha definida. Entre com seu e-mail.');return;}user=result.user;await loadCatalog();frame();goto(user.role==='admin'?'admin':'inicio');render();});}
const menu=[['','Vis\xE3o geral'],['track','Trilhas'],['module','M\xF3dulos'],['lesson','Aulas'],['event','Agenda'],['users','Alunos e acessos'],['questions','D\xFAvidas'],['audit','Registro de a\xE7\xF5es']];
function adminShell(section,title,description,content,action=''){main.innerHTML=\`<div class="management"><aside class="admin-menu"><h2>Administra\xE7\xE3o</h2>\${menu.map(([id,label])=>\`<a href="#admin\${id?'/'+id:''}" class="\${id===section?'active':''}">\${label}</a>\`).join('')}<a href="#inicio">\u2190 \xC1rea do aluno</a></aside><section><div class="admin-head"><div><h1>\${h(title)}</h1><p>\${h(description)}</p></div>\${action}</div>\${content}</section></div>\`;}
async function admin(section='',id){if(user.role!=='admin'){main.innerHTML='<div class="empty"><h1>Acesso restrito</h1><p>Esta \xE1rea \xE9 exclusiva da administra\xE7\xE3o.</p><a href="#inicio">Voltar</a></div>';return;}adminRecords=(await api('/admin/records')).records;if(!section){const stats=[['Trilhas','track'],['M\xF3dulos','module'],['Aulas','lesson'],['Eventos','event']];adminShell('','Vis\xE3o geral','Gerencie o conte\xFAdo e acompanhe a opera\xE7\xE3o do Arrivo In It\xE1lia.',\`<div class="metrics">\${stats.map(([name,kind])=>\`<a class="metric" href="#admin/\${kind}"><strong>\${adminRecords.filter(r=>r.kind===kind&&r.status!=='archived').length}</strong><span>\${name}</span></a>\`).join('')}<a class="metric" href="#admin/questions"><strong>\${adminRecords.filter(r=>r.kind==='question'&&r.status==='open').length}</strong><span>D\xFAvidas aguardando resposta</span></a><div class="metric"><strong>\${adminRecords.filter(r=>r.kind==='lesson'&&r.status==='published').length}</strong><span>Aulas publicadas</span></div></div><div class="editor"><h2>Seu fluxo de publica\xE7\xE3o</h2><p class="help">1. Cadastre um m\xF3dulo para agrupar as aulas.<br>2. Insira as aulas com v\xEDdeo, descri\xE7\xE3o e tarefas.<br>3. Organize os m\xF3dulos em etapas de uma trilha.<br>4. Publique os conte\xFAdos quando estiverem prontos.</p><p class="help">As aulas em rascunho e os conte\xFAdos arquivados n\xE3o aparecem para os alunos. A \xE1rea do aluno sempre exibe apenas o conte\xFAdo publicado, inclusive quando voc\xEA a acessa como administrador.</p></div>\`);return;}
 if(section==='users')return usersPage();if(section==='audit'){const {entries}=await api('/admin/audit');adminShell(section,'Registro de a\xE7\xF5es','\xDAltimas 100 altera\xE7\xF5es administrativas.',\`<div class="table-wrap"><table><thead><tr><th>Data</th><th>Respons\xE1vel</th><th>A\xE7\xE3o</th><th>Registro</th></tr></thead><tbody>\${entries.map(e=>\`<tr><td>\${h(date(e.created*1000))}</td><td>\${h(e.actorName||e.actor)}</td><td>\${h(e.action)}</td><td>\${h(e.target)}</td></tr>\`).join('')}</tbody></table></div>\`);return;}
 if(section==='questions')return questionsAdmin(id);
 if(!['track','module','lesson','event'].includes(section))return notfound();if(id)return editor(section,id);
 const titles={track:'Trilhas',module:'M\xF3dulos',lesson:'Aulas',event:'Agenda'};adminShell(section,titles[section],'Crie, edite, publique ou arquive os registros.',\`<div class="admin-toolbar"><input id="admin-search" aria-label="Buscar registros" placeholder="Buscar por t\xEDtulo\u2026"><select id="admin-filter" aria-label="Filtrar estado"><option value="all">Todos os estados</option><option value="published">Publicados</option><option value="draft">Rascunhos</option><option value="archived">Arquivados</option></select></div><div id="admin-list"></div>\`,\`<a class="primary" href="#admin/\${section}/new">+ \${section==='event'?'Novo evento':section==='module'?'Novo m\xF3dulo':section==='lesson'?'Nova aula':'Nova trilha'}</a>\`);const list=()=>{const query=document.querySelector('#admin-search').value.toLowerCase(),status=document.querySelector('#admin-filter').value;const rows=adminRecords.filter(r=>r.kind===section&&(status==='all'||r.status===status)&&r.title.toLowerCase().includes(query)).sort(order);document.querySelector('#admin-list').innerHTML=rows.length?\`<div class="table-wrap"><table><thead><tr><th>T\xEDtulo</th><th>Estado</th><th>Ordem</th><th></th></tr></thead><tbody>\${rows.map(r=>\`<tr><td>\${h(r.title)}\${section==='lesson'?\`<small>\${h(adminRecords.find(m=>m.id===r.moduleId)?.title||'')}</small>\`:''}\${section==='event'?\`<small>\${h(date(r.start))}</small>\`:''}</td><td>\${badge(r.status)}</td><td>\${r.order||0}</td><td><a class="outline" href="#admin/\${section}/\${h(r.id)}">Editar</a></td></tr>\`).join('')}</tbody></table></div>\`:'<div class="empty"><h2>Nenhum registro encontrado</h2><p>Crie um registro ou ajuste os filtros.</p></div>';};document.querySelector('#admin-search').oninput=list;document.querySelector('#admin-filter').onchange=list;list();}
function localDate(s){if(!s)return '';const d=new Date(s);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);}
function editor(kind,id){const old=id==='new'?null:adminRecords.find(r=>r.id===id&&r.kind===kind);if(id!=='new'&&!old)return notfound();const r=old||{title:'',description:'',status:'draft',order:0,groups:[],tasks:[]};const names={track:'trilha',module:'m\xF3dulo',lesson:'aula',event:'evento'};const modules=adminRecords.filter(r=>r.kind==='module'&&r.status!=='archived').sort(order);const common=\`\${field('T\xEDtulo','title',r.title,'text',true)}\${area('Descri\xE7\xE3o','description',r.description)}<div class="row">\${select('Estado','status',[['draft','Rascunho'],['published','Publicado'],['archived','Arquivado']],r.status)}\${field('Ordem de exibi\xE7\xE3o','order',r.order,'number')}</div>\`;let fields='';if(kind==='module')fields=\`<div class="row">\${field('Categoria','category',r.category||'CURSOS','text',true)}\${field('S\xEDmbolo do cart\xE3o','symbol',r.symbol||'\u25C7')}</div>\`;if(kind==='lesson')fields=\`\${select('M\xF3dulo','moduleId',modules.map(m=>[m.id,m.title]),r.moduleId||modules[0]?.id)}\${field('Link do v\xEDdeo','videoUrl',r.videoUrl||'','url')}<small>YouTube, Vimeo ou link HTTPS de um arquivo MP4. O v\xEDdeo \xE9 necess\xE1rio para publicar a aula.</small>\${field('Dura\xE7\xE3o em minutos','duration',r.duration||0,'number')}\${area('Tarefas (uma por linha)','tasks',(r.tasks||[]).map(t=>t.title).join('\\n'))}\${old?\`<a class="outline" href="#preview/\${h(id)}">Ver pr\xE9via da aula</a>\`:''}\`;
 if(kind==='event')fields=\`<div class="row">\${field('In\xEDcio','start',localDate(r.start),'datetime-local',true)}\${field('T\xE9rmino','end',localDate(r.end),'datetime-local',true)}</div><small>Hor\xE1rios em \${h(Intl.DateTimeFormat().resolvedOptions().timeZone)}. Cada aluno ver\xE1 no pr\xF3prio fuso.</small>\${field('Respons\xE1vel pelo encontro','host',r.host||'')}\${field('Local ou plataforma','location',r.location||'')}\${field('Link do encontro','joinUrl',r.joinUrl||'','url')}\`;
 if(kind==='track')fields=\`\${field('Texto curto do banner','tag',r.tag||'SUA JORNADA')}<div><h3>Etapas e m\xF3dulos</h3><p class="help">Crie as etapas na sequ\xEAncia desejada. Marque os m\xF3dulos e use os n\xFAmeros para ordenar cada etapa.</p><div id="sections"></div><button type="button" class="outline" id="add-section">+ Adicionar etapa</button></div>\`;
 adminShell(kind,(old?'Editar ':'Criar ')+names[kind],'As altera\xE7\xF5es s\xF3 ser\xE3o aplicadas ao salvar.',\`<section class="editor"><form class="form" id="editor-form">\${common}\${fields}\${errorBox}<div class="form-actions"><button class="primary" type="submit">Salvar \${names[kind]}</button><a class="outline" href="#admin/\${kind}">Cancelar</a></div></form></section>\`);
 let groups=structuredClone(r.groups||[]);function drawGroups(){const root=document.querySelector('#sections');root.innerHTML=groups.map((g,i)=>\`<div class="section-builder" data-section="\${i}"><div class="section-heading"><input data-section-name value="\${h(g[0])}" aria-label="Nome da etapa \${i+1}" required><button type="button" data-up="\${i}" class="outline" \${i===0?'disabled':''} aria-label="Mover etapa para cima">\u2191</button><button type="button" data-remove="\${i}" class="outline danger" aria-label="Remover etapa">\xD7</button></div><div class="module-options">\${modules.map((m,mi)=>\`<div class="module-choice"><input type="checkbox" data-mid="\${h(m.id)}" aria-label="Incluir \${h(m.title)}" \${g[1].includes(m.id)?'checked':''}><span>\${h(m.title)}</span><input type="number" data-order-for="\${h(m.id)}" min="0" value="\${g[1].includes(m.id)?g[1].indexOf(m.id):mi}" aria-label="Ordem de \${h(m.title)}"></div>\`).join('')}</div></div>\`).join('');root.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{collectGroups();groups.splice(Number(b.dataset.remove),1);drawGroups();});root.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>{collectGroups();const i=Number(b.dataset.up);[groups[i-1],groups[i]]=[groups[i],groups[i-1]];drawGroups();});}
 function collectGroups(){groups=[...document.querySelectorAll('[data-section]')].map(section=>[section.querySelector('[data-section-name]').value,[...section.querySelectorAll('[data-mid]:checked')].map(el=>({id:el.dataset.mid,order:Number([...section.querySelectorAll('[data-order-for]')].find(x=>x.dataset.orderFor===el.dataset.mid).value)})).sort((a,b)=>a.order-b.order).map(x=>x.id)]);}
 if(kind==='track'){drawGroups();document.querySelector('#add-section').onclick=()=>{collectGroups();groups.push(['Nova etapa',[]]);drawGroups();};}
 attachForm('editor-form',async b=>{b.kind=kind;b.order=Number(b.order);if(old)b.revision=old.revision;if(kind==='track'){collectGroups();b.groups=groups;}if(kind==='lesson'){b.duration=Number(b.duration);b.tasks=b.tasks.split('\\n').map(s=>s.trim()).filter(Boolean).map(title=>({id:(r.tasks||[]).find(t=>t.title===title)?.id||crypto.randomUUID(),title}));}if(kind==='event'){b.start=new Date(b.start).toISOString();b.end=new Date(b.end).toISOString();}await api('/admin/records'+(old?'/'+id:''),old?'PUT':'POST',b);await loadCatalog();toast('Conte\xFAdo salvo.');goto('admin/'+kind);});}
async function usersPage(){const {users,invites}=await api('/admin/users');adminShell('users','Alunos e acessos','Convide pessoas e controle suas permiss\xF5es.',\`<section class="editor"><h2>Gerar convite de acesso</h2><form id="invite-form" class="form"><div class="row">\${field('E-mail','email','','email',true)}\${select('Perfil','role',[['student','Aluno'],['admin','Administrador']],'student')}</div><small>Administradores podem gerenciar todos os conte\xFAdos e usu\xE1rios. O link \xE9 pessoal, vale por 24 horas e n\xE3o \xE9 enviado automaticamente.</small>\${errorBox}<div><button class="primary" type="submit">Gerar convite</button></div></form><div id="invite-result"></div></section><div class="section-title"><h2>Contas cadastradas</h2></div><div class="table-wrap"><table><thead><tr><th>Pessoa</th><th>Perfil</th><th>Estado</th><th></th></tr></thead><tbody>\${users.map(u=>\`<tr><td>\${h(u.name)}<small>\${h(u.email)}</small></td><td>\${u.role==='admin'?'Administrador':'Aluno'}</td><td>\${badge(u.status)}</td><td><button class="outline" data-user="\${h(u.id)}">Gerenciar</button></td></tr>\`).join('')}</tbody></table></div><div class="section-title"><h2>Convites e recupera\xE7\xF5es recentes</h2></div><div class="table-wrap"><table><thead><tr><th>E-mail</th><th>Tipo</th><th>Validade</th><th>Estado</th></tr></thead><tbody>\${invites.map(i=>\`<tr><td>\${h(i.email)}</td><td>\${i.kind==='reset'?'Recupera\xE7\xE3o':'Convite'}</td><td>\${h(date(i.expires*1000))}</td><td>\${i.used?'Utilizado ou revogado':'Pendente'}</td></tr>\`).join('')}</tbody></table></div><p class="help">Enquanto a pr\xE9via estiver privada, o convite do aplicativo n\xE3o altera a restri\xE7\xE3o de acesso da hospedagem. A abertura para alunos externos ser\xE1 feita na publica\xE7\xE3o final.</p>\`);
 const showInvite=(r)=>{const link=location.origin+'/#ativar?token='+r.token;document.querySelector('#invite-result').innerHTML=\`<div class="invite-result"><strong>Link gerado para \${h(r.email)}</strong><p class="help">Copie e entregue somente \xE0 pessoa destinat\xE1ria. V\xE1lido at\xE9 \${h(date(r.expires*1000))}.</p><textarea readonly aria-label="Link pessoal de acesso">\${h(link)}</textarea><button class="outline" id="copy-link">Copiar link</button></div>\`;document.querySelector('#copy-link').onclick=async()=>{try{await navigator.clipboard.writeText(link);toast('Link copiado.');}catch{document.querySelector('#invite-result textarea').select();toast('Selecione e copie o link.');}};};attachForm('invite-form',async b=>showInvite(await api('/admin/invites','POST',{...b,kind:'invite'})));
 document.querySelectorAll('[data-user]').forEach(btn=>btn.onclick=()=>{const u=users.find(u=>u.id===btn.dataset.user);const dialog=document.querySelector('#detail');document.querySelector('#dialog-content').innerHTML=\`<h2>\${h(u.name)}</h2><p class="muted">\${h(u.email)}</p><form class="form" id="user-form">\${select('Perfil','role',[['student','Aluno'],['admin','Administrador']],u.role)}\${select('Estado','status',[['active','Ativo'],['suspended','Suspenso']],u.status)}\${errorBox}<button type="submit" class="primary" \${u.id==='owner'||u.id===user.id?'disabled':''}>Salvar permiss\xF5es</button><button type="button" class="outline" id="reset-link">Gerar link para nova senha</button><small>Suspender a conta encerra as sess\xF5es e bloqueia o acesso.</small></form>\`;dialog.showModal();attachForm('user-form',async b=>{await api('/admin/users/'+u.id,'PUT',b);dialog.close();await usersPage();toast('Acesso atualizado.');});document.querySelector('#reset-link').onclick=async e=>{e.target.disabled=true;try{const r=await api('/admin/invites','POST',{email:u.email,kind:'reset'});dialog.close();showInvite(r);}catch(err){document.querySelector('#user-form .form-error').textContent=err.message;e.target.disabled=false;}};});}
function questionsAdmin(id){const questions=adminRecords.filter(r=>r.kind==='question');if(id){const q=questions.find(q=>q.id===id);if(!q)return notfound();adminShell('questions','Responder d\xFAvida',q.studentName,\`<div class="question">\${h(q.text)}</div><section class="editor"><form id="answer-form" class="form">\${area('Resposta','answer',q.answer)}\${errorBox}<button class="primary" type="submit">Salvar resposta</button></form></section>\`);attachForm('answer-form',async b=>{await api('/admin/records/'+q.id,'PUT',{...b,revision:q.revision});goto('admin/questions');});return;}adminShell('questions','D\xFAvidas dos alunos','Responda \xE0s perguntas de cada aluno.',\`<div class="table-wrap"><table><thead><tr><th>Aluno</th><th>D\xFAvida</th><th>Estado</th><th></th></tr></thead><tbody>\${questions.map(q=>\`<tr><td>\${h(q.studentName)}</td><td>\${h(q.text.slice(0,140))}<small>\${h(adminRecords.find(l=>l.id===q.lessonId)?.title||'')}</small></td><td>\${badge(q.status)}</td><td><a class="outline" href="#admin/questions/\${h(q.id)}">Responder</a></td></tr>\`).join('')}</tbody></table></div>\`);}
function support(){main.innerHTML='<div class="container narrow"><h1 class="page-title">Suporte</h1><div class="support-grid"><article><h2>D\xFAvidas sobre as aulas</h2><p>Abra uma aula e use a aba D\xFAvidas. A equipe responder\xE1 ali, na sua conta.</p></article><article><h2>Acesso e senha</h2><p>Altere a senha em Meu perfil. Se n\xE3o conseguir entrar, solicite um link de recupera\xE7\xE3o \xE0 administra\xE7\xE3o.</p></article><article><h2>Seu progresso</h2><p>Marque cada aula conclu\xEDda ao terminar. Anota\xE7\xF5es, favoritos e progresso ficam salvos na sua conta.</p></article><article><h2>Conte\xFAdo em produ\xE7\xE3o</h2><p>Alguns m\xF3dulos ainda est\xE3o sendo preparados. As videoaulas aparecer\xE3o quando forem publicadas pela equipe.</p></article></div></div>';}
function notfound(){main.innerHTML='<div class="container"><div class="empty"><h1>Conte\xFAdo n\xE3o encontrado</h1><p>Este conte\xFAdo pode n\xE3o estar publicado.</p><a class="primary" href="#inicio">Voltar ao in\xEDcio</a></div></div>';}
async function render(){const version=++routeVersion;frame();const parts=location.hash.slice(1).split('?')[0].split('/'),route=parts[0]||'inicio';document.querySelectorAll('[data-nav]').forEach(a=>{a.classList.toggle('selected',a.dataset.nav===route);});if(!user||route==='ativar')return authPage();try{if(route==='admin'){main.innerHTML='<div class="loading">Carregando administra\xE7\xE3o\u2026</div>';await admin(parts[1]||'',parts[2]);}else if(route==='inicio'||route==='entrar')home();else if(route==='trilha')trail(parts[1]);else if(route==='modulo')modulePage(parts[1]);else if(route==='aula'){let id=parts[1];if(parts[2]){const l=byKind('lesson').filter(l=>l.moduleId===id)[Number(parts[2])];if(!l)return modulePage(id);id=l.id;}await lesson(id);}else if(route==='preview'){if(user.role!=='admin')return notfound();adminRecords=(await api('/admin/records')).records;await lesson(parts[1],true);}else if(route==='agenda')agenda();else if(route==='perfil')profile();else if(['historico','favoritos'].includes(route))collection(route);else if(route==='suporte')support();else notfound();}catch(e){if(e.status===401){user=null;frame();authPage();}else main.innerHTML=\`<div class="empty"><h1>N\xE3o foi poss\xEDvel carregar</h1><p>\${h(e.message)}</p><button class="primary" id="retry">Tentar novamente</button></div>\`;document.querySelector('#retry')?.addEventListener('click',render);}if(version===routeVersion)window.scrollTo(0,0);}
document.querySelector('.skip').onclick=e=>{e.preventDefault();main.focus();main.scrollIntoView();};document.querySelector('#detail .close').onclick=()=>document.querySelector('#detail').close();
window.addEventListener('hashchange',()=>{render();main.focus({preventScroll:true});});
async function start(){main.innerHTML='<div class="loading">Preparando sua \xE1rea\u2026</div>';try{try{user=(await api('/auth/me')).user;}catch(e){if(e.status!==401)throw e;}if(user)await loadCatalog();else authSetup=(await api('/auth/status')).setup;await render();}catch(e){main.innerHTML=\`<div class="empty"><h1>N\xE3o foi poss\xEDvel conectar</h1><p>\${h(e.message)}</p><button class="primary" id="retry">Tentar novamente</button></div>\`;document.querySelector('#retry').onclick=start;}}start();
`, "type": "text/javascript; charset=utf-8" }, "/index.html": { "body": `<!doctype html>
<html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Arrivo In It\xE1lia: trilhas de conhecimento para planejar sua cidadania, sua mudan\xE7a e sua vida na It\xE1lia."><title>Arrivo In It\xE1lia \xB7 Sua pr\xF3xima etapa</title><link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%23596bd9'/%3E%3Ctext x='16' y='24' text-anchor='middle' font-family='Arial' font-size='24' font-weight='bold' fill='white'%3EA%3C/text%3E%3C/svg%3E"><link rel="stylesheet" href="style.css"><link rel="stylesheet" href="theme-italia.css"><link rel="stylesheet" href="platform.css"><script src="app.js" defer><\/script></head><body><a class="skip" href="#main">Ir para o conte\xFAdo</a><header><a class="brand" href="#inicio"><span class="brandmark">a<span>\u2197</span></span><span>Arrivo<span class="italia">In It\xE1lia<span class="flag">\u25B0 \u25B0 \u25B0</span></span></span></a><nav aria-label="Navega\xE7\xE3o principal"><a href="#inicio" data-nav="inicio">\u2302 <span>In\xEDcio</span></a><a href="#agenda" data-nav="agenda">\u25A6 <span>Agenda</span></a><a href="#favoritos" data-nav="favoritos">\u2606 <span>Favoritos</span></a><a href="#historico" data-nav="historico">\u25F7 <span>Hist\xF3rico</span></a><a href="#suporte" data-nav="suporte">\u2661 <span>Suporte</span></a></nav><span class="preview-label">PR\xC9VIA DO APLICATIVO</span><span class="avatar" aria-label="Perfil visitante">V</span></header><div class="journeybar"><div class="learner"><span class="mini-avatar">\u2726</span><span><small>Sua jornada come\xE7a aqui</small><strong>Explorador</strong></span></div><div class="xp"><div><span>Seu pr\xF3ximo destino: conhecimento</span><strong id="xp-count">0 XP</strong></div><progress id="xp" max="100" value="0" aria-label="Experi\xEAncia"></progress></div><a class="active-path" href="#trilha/cidadania"><span>\u2667</span><span><small>Explore uma trilha</small><strong id="active-name">Reconhecer minha cidadania</strong></span><span>\u203A</span></a></div><main id="main" tabindex="-1"></main><footer><a class="brandtext" href="#inicio">Arrivo In It\xE1lia \u2197</a><span>Um passo de cada vez. Uma nova vida pela frente.</span><small>Pr\xE9via \xB7 Aulas em produ\xE7\xE3o</small><a class="credit" href="https://commons.wikimedia.org/wiki/File:Landscape_in_Val_d%27Orcia.jpg" target="_blank" rel="noopener">Foto: Salvatore Gerace \xB7 CC BY 2.0 \xB7 recorte</a></footer><div id="toast" role="status"></div><dialog id="detail"><button class="close" aria-label="Fechar">\xD7</button><div id="dialog-content"></div></dialog></body></html>
`, "type": "text/html; charset=utf-8" }, "/platform.css": { "body": ".account-nav{display:flex;gap:8px;align-items:center;margin-left:auto}.account-nav a{font-size:12px;padding:8px;border-radius:8px;background:#e5efe6}.account-nav button{font-size:12px;padding:8px;border:1px solid #d9e4da;border-radius:8px;background:#fff}.account-nav .avatar{width:auto;padding:8px 12px;border-radius:8px}.auth-shell{max-width:480px;margin:45px auto;padding:30px;background:#fffdf9;border:1px solid #e0e8de;border-radius:16px;box-shadow:0 12px 30px #354a3910}.auth-shell h1{font:800 27px Manrope}.form{display:grid;gap:17px}.form label{display:grid;gap:7px;font-size:14px;font-weight:600}.form input,.form select,.form textarea,.filter-select{width:100%;border:1px solid #cddcd0;border-radius:7px;padding:11px;background:#fff;color:#304638;font-size:14px}.form textarea{min-height:90px}.form .row{display:grid;grid-template-columns:1fr 1fr;gap:17px}.form small{font-weight:400;font-size:12px;color:#69766d;line-height:1.6}.form-error{color:#a33232;line-height:1.6;font-size:14px}.form-success{color:#34765c}.form .checkline{display:flex;align-items:center;gap:10px;font-weight:400}.checkline input{width:17px}.form-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.management{display:grid;grid-template-columns:200px minmax(0,1fr);gap:26px;max-width:1280px;margin:auto;padding:32px}.admin-menu{background:#fffc;border:1px solid white;border-radius:12px;padding:15px;height:fit-content;display:grid;gap:5px}.admin-menu a{padding:11px;font-size:14px;border-radius:7px}.admin-menu a.active{background:#dfeddf;color:#2d6a45;font-weight:700}.admin-menu h2{font:700 17px Manrope;padding:0 10px}.admin-head{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-bottom:22px}.admin-head h1{font:800 27px Manrope;margin:0}.admin-head p{font-size:13px;color:#6d786d;line-height:1.6}.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-bottom:25px}.metric{background:#fffdf9;border:1px solid #dfe6db;padding:22px;border-radius:11px}.metric strong{display:block;font-size:32px;color:#3b7752}.metric span{font-size:13px;color:#6b796c}.table-wrap{overflow:auto;background:#fffdfb;border:1px solid #dfe7dc;border-radius:10px}table{border-collapse:collapse;width:100%;font-size:14px}th,td{text-align:left;padding:15px;border-bottom:1px solid #e9eee5;vertical-align:middle}th{color:#697567;font-weight:500;font-size:12px}td small{display:block;color:#74806f;margin-top:4px}td .outline{white-space:nowrap}.status{display:inline-block;font-size:11px;background:#e9eee7;color:#63745f;padding:5px 9px;border-radius:20px;white-space:nowrap}.status.published,.status.active{background:#dcefdc;color:#326a3b}.status.draft,.status.open{background:#fbefd0;color:#85671b}.status.archived,.status.suspended{background:#f5dedb;color:#944f45}.editor{background:#fffdfbdd;border:1px solid white;padding:25px;border-radius:12px}.section-builder{border:1px solid #d9e5d6;padding:17px;border-radius:9px;margin:12px 0}.section-builder .module-options{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0;max-height:240px;overflow:auto}.module-choice{display:grid;grid-template-columns:20px 1fr 62px;align-items:center;gap:8px;font-size:13px}.module-choice input[type=number]{padding:5px}.admin-notice{background:#f5ebdb;padding:16px;border-radius:9px;font-size:13px;line-height:1.7;margin:20px 0}.profile-grid{display:grid;grid-template-columns:1fr 1fr;gap:25px}.loading{padding:70px;text-align:center;color:#687c68}.video-player{width:100%;aspect-ratio:16/9;border:0;border-radius:12px;background:#1e3025}.question{background:#fffdfc;padding:18px;border:1px solid #e0e8dc;border-radius:9px;margin:12px 0;font-size:14px;line-height:1.7;white-space:pre-wrap}.question .answer{margin-top:15px;padding:12px;background:#edf5eb;border-radius:6px}.event-row{display:flex;gap:20px;align-items:center;background:#fffdfb;padding:22px;margin:12px 0;border:1px solid #e1e7db;border-radius:11px}.event-row .date{color:#4b7e57;font-size:14px;min-width:95px}.event-row h2{font-size:17px;margin:0 0 5px}.event-row .outline{margin-left:auto}.danger{color:#a34d46!important;border-color:#e0bbb5!important}.auth-shell>.brandtext{font-size:22px}.form button:disabled{opacity:.65}.section-builder .section-heading{display:flex;gap:10px;align-items:center}.section-builder .section-heading input{flex:1}.profile-avatar{display:grid;place-items:center;width:65px;height:65px;border-radius:50%;background:#ddebdf;color:#42704c;font-size:26px;margin-bottom:18px}.invite-result{word-break:break-all;padding:20px;background:#eff6ec;border:1px solid #d9e4d2;border-radius:10px}.invite-result textarea{min-height:100px}.help{font-size:13px;line-height:1.8;color:#647462}.admin-toolbar{display:flex;gap:12px;margin:15px 0;align-items:center}.admin-toolbar input{padding:10px;border-radius:7px;border:1px solid #d3dfd0;min-width:0;flex:1}.admin-toolbar select{padding:10px;max-width:180px;border-radius:7px;border:1px solid #d3dfd0}.plaincopy{white-space:pre-wrap;line-height:1.8}.cancel-button{border:0;background:none;color:#747d6f;font-size:13px;cursor:pointer}.completion{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:24px 0}.save-state{font-size:12px;color:#74846f}.nav-admin{display:none}.nav-admin.visible{display:inline-block}\n@media(max-width:900px){header{gap:14px;flex-wrap:wrap;height:auto;padding-top:15px;padding-bottom:10px}header nav{margin:0;min-height:40px}.account-nav{margin-left:auto}.management{grid-template-columns:1fr;padding:22px 18px}.admin-menu{display:flex;overflow:auto}.admin-menu h2{display:none}.admin-menu a{white-space:nowrap}.profile-grid{grid-template-columns:1fr}.metrics{grid-template-columns:repeat(2,1fr)}}\n@media(max-width:600px){.account-nav a,.account-nav button{font-size:11px;padding:7px}.auth-shell{margin:25px 16px;padding:23px}.form .row{grid-template-columns:1fr}.admin-head{flex-wrap:wrap}.metrics{grid-template-columns:1fr 1fr}.metric{padding:15px}.metric strong{font-size:25px}.section-builder .module-options{grid-template-columns:1fr}.editor{padding:17px}.event-row{flex-wrap:wrap}.event-row .outline{margin-left:0}.admin-toolbar{flex-wrap:wrap}}\n", "type": "text/css; charset=utf-8" }, "/style.css": { "body": `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');
:root{font-family:'DM Sans',sans-serif;color:#292941;background:#f0effa;font-synthesis:none;--blue:#596ddd;--muted:#74768d;--line:#dadbea;--photo:url("https://upload.wikimedia.org/wikipedia/commons/8/8e/Landscape_in_Val_d%27Orcia.jpg")}*{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse at 0 40%,#e9dffa80,transparent 60%),radial-gradient(ellipse at 100% 70%,#dceef2,transparent 65%),#f1eff9;min-height:100vh}button,input,textarea{font:inherit}a{color:inherit;text-decoration:none}button,a,input,textarea{touch-action:manipulation}button{cursor:pointer}button:disabled{cursor:default}button:focus-visible,a:focus-visible,input:focus-visible,textarea:focus-visible,summary:focus-visible{outline:3px solid #364dcd;outline-offset:4px}.skip{position:absolute;left:20px;top:-100px;z-index:100;background:white;padding:16px}.skip:focus{top:10px}header{height:84px;display:flex;align-items:center;gap:32px;padding:0 4.5%;background:#f8f7fdee;border-bottom:1px solid var(--line)}.brand{display:flex;align-items:center;gap:9px;font-family:Manrope;font-weight:800;font-size:24px;line-height:1}.brandmark{width:39px;height:42px;border-radius:12px;background:var(--blue);color:white;font-size:34px;text-align:center;position:relative}.brandmark span{position:absolute;font-size:21px;right:0;top:0}.italia{display:block;font-size:20px;letter-spacing:3px;margin-top:4px}.flag{font-size:8px;letter-spacing:0;color:#34896f;padding-left:4px}nav{display:flex;align-self:stretch;gap:25px;margin-left:35px}nav a{display:flex;gap:7px;align-items:center;font-size:14px;color:#77778b;border-bottom:3px solid transparent;padding-top:3px}nav a.selected{color:var(--blue);border-color:var(--blue)}.preview-label{font-size:10px;letter-spacing:1.2px;margin-left:auto;color:#77768d;background:#eae8f5;border-radius:5px;padding:7px}.avatar,.mini-avatar{display:grid;place-items:center;border-radius:50%;background:#e3ddf8;color:#6355a6;width:35px;height:35px;font-weight:700}.journeybar{display:flex;justify-content:center;align-items:center;gap:36px;background:#ffffff75;border-bottom:1px solid #e4e1ee;padding:14px 4%;min-height:76px}.learner{display:flex;align-items:center;gap:10px}.learner small,.active-path small{display:block;font-size:11px;color:var(--muted);margin-bottom:4px}.learner strong,.active-path strong{font-size:13px}.xp{width:300px}.xp>div{display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-bottom:5px}progress{width:100%;height:6px;border:0;border-radius:10px;overflow:hidden;background:#e2e3f0}progress::-webkit-progress-bar{background:#e2e3f0}progress::-webkit-progress-value{background:linear-gradient(90deg,#83b0ff,#596bdd);border-radius:10px}progress::-moz-progress-bar{background:#596bdd}.active-path{display:flex;gap:13px;align-items:center;background:#fafaff;border:1px solid #e5e2ef;border-radius:9px;padding:8px 14px;box-shadow:0 2px 5px #37355606}.active-path>span:first-child{color:var(--blue);font-size:23px}.active-path>span:last-child{margin-left:24px}main{min-height:70vh}.container{max-width:1240px;margin:auto;padding:34px 32px 50px}.hero{position:relative;overflow:hidden;min-height:295px;border-radius:16px;background:linear-gradient(90deg,#253548df,#34485850),var(--photo) center 52%/cover;color:white;padding:43px 44px;box-shadow:0 14px 30px #323c6020}.hero .eyebrow{color:#e0e8e2}.eyebrow{font-size:11px;letter-spacing:2px;font-weight:700;text-transform:uppercase}.hero h1{font:700 38px/1.25 Manrope;max-width:600px;margin:13px 0}.hero p{font-size:15px;line-height:1.7;color:#eceef6;max-width:510px}.hero-stamp{position:absolute;right:35px;top:30px;background:#ffffff16;border:1px solid #ffffff44;border-radius:40px;padding:9px 15px;font-size:12px;backdrop-filter:blur(6px)}.searchbar{display:flex;max-width:640px;margin:-23px auto 28px;position:relative;background:#fdfcff;border:1px solid #ebe7f7;padding:7px 8px 7px 20px;border-radius:12px;box-shadow:0 8px 22px #38355118;gap:12px;align-items:center}.searchbar input{border:0;outline:none;background:transparent;flex:1;min-width:0;padding:8px;font-size:14px;color:#44445b}.searchbar button,.primary{border:0;background:var(--blue);color:white;border-radius:7px;padding:11px 18px;box-shadow:0 4px 9px #526bdb20;font-size:14px;font-weight:600}.searchbar button{font-size:20px;padding:6px 15px}.section-title{display:flex;justify-content:space-between;align-items:center;margin:28px 0 15px;gap:14px}.section-title h2{font:800 20px Manrope;margin:0}.section-title p{font-size:13px;color:var(--muted);margin:7px 0 0}.section-title>a,.textbutton{font-size:13px;color:var(--blue)}.resume{display:flex;align-items:center;gap:19px;background:#ffffffac;border:1px solid white;border-radius:12px;padding:20px 23px;box-shadow:0 5px 12px #3c355908}.play-small{display:grid;place-items:center;background:#e6eaff;color:var(--blue);border-radius:50%;width:47px;height:47px;flex-shrink:0;font-size:20px}.resume h3{font-size:15px;margin:0 0 6px}.resume p{font-size:13px;color:var(--muted);margin:0}.resume .primary{margin-left:auto;white-space:nowrap}.tracks{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}.track{position:relative;min-height:205px;border-radius:13px;overflow:hidden;color:white;background:linear-gradient(0deg,#162037f5,#283d4940),var(--photo) center/cover;box-shadow:0 7px 15px #36335118;transition:transform .2s;display:block}.track:nth-child(2){background-position:65% center}.track:nth-child(3){background-position:95% center}.track:hover,.track:focus-within{transform:translateY(-4px)}.track .topline{position:absolute;top:19px;left:20px;right:20px;display:flex;justify-content:space-between;align-items:center;font-size:11px}.pill{border:1px solid #ffffff50;background:#ffffff19;padding:5px 9px;border-radius:30px;font-size:11px}.track-info{position:absolute;bottom:20px;left:20px;right:20px}.track h3{font:700 18px/1.35 Manrope;margin:5px 0}.track p{font-size:12px;line-height:1.5;color:#e4e8f1;margin:8px 0;display:none}.track:hover p,.track:focus-within p{display:block}.track-link{font-size:12px;display:flex;justify-content:space-between;margin-top:12px;color:#dbe4ff}.catalog{margin-top:35px}.catalog summary{font:700 19px Manrope;cursor:pointer;padding:15px 0;list-style:none}.catalog summary:before{content:'\u2304';color:#9090a7;margin-right:10px}.catalog:not([open]) summary:before{content:'\u203A'}.poster-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:19px;padding:5px 0 17px}.poster{height:267px;border-radius:12px;position:relative;overflow:hidden;background:linear-gradient(0deg,#1a233ce8,transparent 85%),linear-gradient(140deg,#879fbd,#e0deeb);color:white;transition:transform .2s;box-shadow:0 6px 13px #30314f16}.poster:hover{transform:translateY(-4px)}.poster:nth-child(2){background:linear-gradient(0deg,#243e43ed,transparent),linear-gradient(130deg,#72a59b,#dce8d7)}.poster:nth-child(3){background:linear-gradient(0deg,#543c55ed,transparent),linear-gradient(130deg,#d7a3b7,#efe1c9)}.poster:nth-child(4){background:linear-gradient(0deg,#343b59ed,transparent),linear-gradient(130deg,#9da9cf,#d1e0ec)}.poster:nth-child(5){background:linear-gradient(0deg,#384b4ded,transparent),linear-gradient(130deg,#83b5bc,#e4e3c7)}.poster-photo{background:linear-gradient(0deg,#233340,transparent),var(--photo) 60% center/cover!important}.poster>span{position:absolute;left:15px;top:16px;font-size:10px;letter-spacing:1.4px}.poster .course-symbol{position:absolute;top:65px;width:100%;text-align:center;font-size:64px;font-weight:400;color:#ffffffb0;text-shadow:0 5px 20px #2a304640}.poster-copy{position:absolute;bottom:19px;left:17px;right:13px}.poster h3{font:700 16px/1.35 Manrope;margin:7px 0}.poster small{font-size:11px;color:#e6e8ef}.welcome-row{display:flex;gap:21px}.welcome-row .poster{width:210px;flex-shrink:0}.welcome-note{align-self:center;max-width:490px;padding:20px}.welcome-note h3{font:700 23px/1.4 Manrope}.welcome-note p{color:var(--muted);font-size:14px;line-height:1.8}.back{display:inline-block;margin-bottom:23px;font-size:13px;color:var(--muted)}.narrow{max-width:960px}.track-hero{min-height:210px;padding-top:45px}.track-hero h1{font-size:29px;max-width:700px}.track-hero p{margin:0;max-width:660px}.path-head{max-width:630px;margin:25px auto;display:flex;justify-content:space-between;align-items:center}.path-head h2{font-size:16px;margin:0}.path-head small{display:block;color:var(--muted);font-size:12px;margin-top:7px}.outline{border:1px solid #d5d6e8;color:var(--blue);background:#ffffff80;border-radius:7px;padding:9px 13px;font-size:13px}.path{max-width:630px;margin:30px auto;border-left:2px solid #d0d1e0;padding-left:26px}.stage{position:relative;margin-bottom:37px}.stage:before{content:'';position:absolute;width:10px;height:10px;border:3px solid #f0edf8;background:#aeb3c9;border-radius:50%;left:-35px;top:16px}.stage h2{font-size:14px;background:#ffffff70;padding:15px 17px;border-radius:7px}.nodes{display:flex;gap:27px;padding-top:12px;flex-wrap:wrap}.node{width:108px;text-align:center;position:relative;font-size:12px;line-height:1.4}.node:not(:last-child):after{content:'';width:21px;height:6px;position:absolute;left:112px;top:33px;background:#bbbccd;border-radius:5px}.node-circle{display:grid;place-items:center;width:69px;height:69px;border-radius:50%;margin:0 auto 12px;background:#e9e8f0;color:#a0a0b4;border:4px solid #f7f6fc;box-shadow:0 5px 0 #cfd0dc;font-size:28px}.node.current .node-circle{color:white;background:#6985ef;border-color:#a9c3ff;box-shadow:0 5px 0 #4b65c7}.node.done .node-circle{background:#51bf85;color:white;box-shadow:0 5px 0 #389764;border-color:#8adeaf}.node strong{display:block}.node small{display:block;color:var(--muted);font-size:10px;margin-top:7px;text-transform:uppercase}.lesson-layout{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:35px;max-width:1240px;margin:auto;padding:34px 32px 60px}.crumb{font-size:12px;color:var(--muted);margin-bottom:23px}.lesson-main h1{font:800 28px/1.4 Manrope;margin:10px 0}.description{font-size:14px;color:var(--muted);line-height:1.8}.lesson-actions{display:flex;justify-content:flex-end;gap:10px;margin:20px 0}.video-empty{aspect-ratio:16/9;background:linear-gradient(110deg,#202c48df,#313c50b0),var(--photo) center/cover;display:grid;place-content:center;text-align:center;border-radius:12px;color:white;padding:25px}.video-empty>span{font-size:44px;color:#d8deff}.video-empty h2{font:700 22px Manrope;margin:17px 0 6px}.video-empty p{font-size:13px;color:#dce0ec;margin:7px;max-width:430px;line-height:1.7}.tabs{display:flex;gap:5px;margin:28px 0 22px;flex-wrap:wrap}.tabs button{border:0;padding:10px 15px;background:#ffffff65;color:#77778b;border-radius:6px;font-size:13px}.tabs button[aria-selected=true]{background:white;color:var(--blue);box-shadow:0 3px 8px #38345509}.tabcontent{min-height:160px}.tabcontent h3{font-size:15px}.task{display:flex;gap:13px;align-items:center;padding:17px;background:#ffffffaa;border:1px solid white;border-radius:9px;margin:11px 0;font-size:13px;line-height:1.5}.task input{accent-color:var(--blue);width:18px;height:18px}.task small{margin-left:auto;white-space:nowrap;color:#8a7629;background:#fbefac;border-radius:20px;padding:4px 8px;font-size:10px}textarea{width:100%;min-height:160px;background:#ffffffa0;border:1px solid white;border-radius:9px;padding:17px;resize:vertical;font-size:14px;color:#383849}.note-status{font-size:12px;color:var(--muted);margin:8px 0}.lesson-sidebar{background:#f9f8ff90;border:1px solid #ffffffaa;border-radius:12px;padding:22px;height:fit-content}.lesson-sidebar h2{font-size:16px;margin:0 0 14px}.lesson-sidebar small{font-size:11px;color:var(--muted)}.lesson-sidebar details{margin-top:17px;background:#ffffffaa;border:1px solid #e2e1ef;border-radius:8px}.lesson-sidebar summary{cursor:pointer;padding:14px;font-size:12px;font-weight:700}.lesson-row{display:flex;gap:11px;align-items:center;padding:13px;font-size:12px;border-top:1px solid #e8e7f0;line-height:1.5}.lesson-row.selected{background:#e6ebfe;color:#5268ca}.lesson-row small{display:block;margin-top:3px;font-size:10px}.lesson-end{display:flex;justify-content:space-between;align-items:center;margin-top:25px;gap:20px}.muted{color:var(--muted);font-size:13px;line-height:1.7}.page-title{font:800 29px Manrope;margin:8px 0 10px}.empty{background:#ffffff85;border:1px solid white;border-radius:12px;padding:45px;text-align:center;margin:25px 0}.empty .empty-icon{font-size:38px;color:#929bcd}.empty h2{font-size:19px}.empty p{max-width:460px;margin:12px auto 25px;line-height:1.8;color:var(--muted);font-size:14px}.support-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:30px}.support-grid article{background:#fff9;padding:26px;border-radius:12px}.support-grid h2{font-size:18px}.support-grid p{font-size:14px;line-height:1.8;color:var(--muted)}footer{border-top:1px solid #e0ddec;padding:23px 4.5%;display:flex;align-items:center;gap:25px;flex-wrap:wrap;font-size:12px;color:#8a899d;background:#f8f6fc80}.brandtext{font:800 17px Manrope;color:#696b92}footer small{margin-left:auto}.credit{font-size:10px;width:100%}#toast{position:fixed;bottom:25px;left:50%;transform:translateX(-50%);padding:13px 20px;background:#303a59;color:white;border-radius:9px;font-size:13px;display:none;z-index:20}dialog{max-width:500px;border:0;border-radius:14px;padding:35px;box-shadow:0 20px 80px #20203050}dialog::backdrop{background:#24243c77}.close{float:right;border:0;background:#ededf5;font-size:23px;border-radius:50%;width:32px;height:32px}.hidden{display:none!important}
@media(min-width:1450px){.container{max-width:1360px}.hero{min-height:325px}.poster{height:295px}}
@media(max-width:1000px){header{gap:16px;padding:0 24px}nav{gap:17px;margin-left:15px}.preview-label{display:none}.avatar{margin-left:auto}.journeybar{gap:20px}.xp{width:210px}.poster-grid{grid-template-columns:repeat(3,1fr)}.lesson-layout{grid-template-columns:minmax(0,1fr) 250px;gap:20px}.hero h1{font-size:32px}.hero-stamp{display:none}.track h3{font-size:16px}}
@media(max-width:700px){header{height:auto;min-height:75px;flex-wrap:wrap;padding:15px 18px 0;gap:10px}.brand{font-size:21px}.italia{font-size:17px}nav{order:3;flex-basis:100%;margin:0;justify-content:space-between;gap:8px;height:48px}nav a{font-size:12px;gap:4px}.avatar{margin-left:auto}.journeybar{padding:12px 18px;gap:15px;justify-content:space-between}.xp{width:42%}.xp>div span{display:none}.xp>div{justify-content:flex-end}.active-path{display:none}.container{padding:22px 18px 35px}.hero{padding:30px 24px;min-height:280px}.hero h1{font-size:28px;max-width:340px}.hero p{font-size:13px}.hero .eyebrow{font-size:10px}.searchbar{margin:-22px 14px 24px;padding-left:8px}.searchbar input{font-size:12px}.section-title h2{font-size:18px}.section-title p{font-size:12px}.section-title>a{font-size:11px}.resume{gap:12px;flex-wrap:wrap;padding:17px}.resume .primary{margin-left:59px}.resume h3{font-size:14px}.resume p{font-size:12px}.tracks{grid-template-columns:1fr;gap:15px}.track{min-height:190px}.track p{display:block}.track h3{font-size:19px}.poster-grid{grid-template-columns:repeat(2,1fr);gap:13px}.poster{height:237px}.poster h3{font-size:15px}.poster .course-symbol{font-size:52px;top:63px}.welcome-row{gap:8px}.welcome-row .poster{width:45%}.welcome-note{padding:6px}.welcome-note h3{font-size:17px}.welcome-note p{font-size:12px}.catalog summary{font-size:17px}.track-hero h1{font-size:25px}.track-hero{min-height:215px}.path{padding-left:18px;margin-left:8px}.stage:before{left:-27px}.nodes{gap:17px}.node{width:85px;font-size:11px}.node-circle{width:60px;height:60px}.node:not(:last-child):after{left:88px;width:13px;top:28px}.path-head{gap:15px}.path-head .outline{max-width:135px}.lesson-layout{display:flex;flex-direction:column;padding:25px 18px}.lesson-main h1{font-size:24px}.lesson-sidebar{order:2}.video-empty h2{font-size:18px}.video-empty>span{font-size:26px}.video-empty p{font-size:12px}.task{padding:13px;gap:9px}.task small{font-size:9px}.empty{padding:30px 20px}.support-grid{grid-template-columns:1fr}footer{gap:15px}footer small{margin-left:0}.section-title{align-items:flex-start}.lesson-end{flex-wrap:wrap}}
`, "type": "text/css; charset=utf-8" }, "/theme-italia.css": { "body": "/* Soft Italian tricolor on page surfaces; course artwork keeps its own palette. */\n:root{--blue:#34765c;--muted:#68716d;--line:#dbe6df;color:#2e3933;background:#f6f8f5}\nbody{background:linear-gradient(105deg,#e5f0e9 0%,#f5f8f4 38%,#fcfbf8 58%,#f7e9e8 100%)}\nheader{background:linear-gradient(100deg,#edf5efee,#fffefbee 55%,#f9eeedee);border-bottom-color:#e1e7df}\nnav a{color:#646e68}nav a.selected{color:#34765c;border-color:#579b78}\n.brandmark{background:#4a886b}.flag{color:transparent;background:linear-gradient(90deg,#559373 0 33%,#fff 33% 66%,#c98080 66%);background-clip:text;-webkit-background-clip:text}\n.preview-label{color:#8d5556;background:#f4dfdf}\n.avatar{background:#f3dedc;color:#955756}.mini-avatar{background:#deeee3;color:#397353}\n.journeybar{background:#ffffff80;border-color:#dfe7e0}\n.active-path{background:#fffefa;border-color:#dfe7df;box-shadow:0 2px 5px #35433706}\nprogress,progress::-webkit-progress-bar{background:#e1e8e1}\nprogress::-webkit-progress-value{background:linear-gradient(90deg,#a5d2af,#4d916c)}\nprogress::-moz-progress-bar{background:#4d916c}\n.searchbar{background:#fffefa;border-color:#e1e7dc;box-shadow:0 8px 22px #394b3914}\n.searchbar input{color:#35423a}.searchbar button,.primary{box-shadow:0 4px 9px #34765c20}\n.play-small{background:#e0efe5;color:#34765c}\n.resume,.task,.empty,.support-grid article{background:#fffefbd9;border-color:#fff;box-shadow:0 5px 12px #3d4a3908}\n.catalog summary:before{color:#84948a}\n.outline{border-color:#cdded1;background:#fffefbcc}\n.path{border-color:#cad8cd}.stage:before{border-color:#f3f7f1;background:#a2b9a9}\n.stage h2{background:#fffefbc9}.node:not(:last-child):after{background:#b6c6ba}\n.node-circle{background:#e8ede7;color:#8b9b90;border-color:#fafcf8;box-shadow:0 5px 0 #cbd6cc}\n.node.current .node-circle{background:#4f926e;border-color:#b4d8bd;box-shadow:0 5px 0 #397451}\n.tabs button{background:#fffefbb3;color:#65716a}.tabs button[aria-selected=true]{color:#34765c;background:#fffefa;box-shadow:0 3px 8px #38453709}\ntextarea{background:#fffefbde;border-color:#dce5da;color:#354239}\n.lesson-sidebar{background:#fffefbd9;border-color:#e3e9df}.lesson-sidebar details{border-color:#dce6dd;background:#fffefb}\n.lesson-row{border-color:#e4eae1}.lesson-row.selected{background:#e3f0e6;color:#326a4c}\n.empty .empty-icon{color:#8aae96}\nfooter{background:linear-gradient(100deg,#edf5efcc,#fffefbcc 55%,#f9eeedcc);border-color:#e0e7dd;color:#718076}\n.brandtext{color:#527861}.close{background:#eaf0e8;color:#45634e}\n#toast{background:#345442}\nbutton:focus-visible,a:focus-visible,input:focus-visible,textarea:focus-visible,summary:focus-visible{outline-color:#286544}\n", "type": "text/css; charset=utf-8" } };

// server/worker.js
var cookieName = "__Host-partiu";
var now = () => Math.floor(Date.now() / 1e3);
var uid = () => crypto.randomUUID();
var token = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, "0")).join("");
var hash2 = async (s) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))), (b) => b.toString(16).padStart(2, "0")).join("");
var HttpError = class extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
};
var fail = (status, message) => {
  throw new HttpError(status, message);
};
var json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", ...headers } });
var stmt = (db, sql, ...args) => db.prepare(sql).bind(...args);
var run = (db, sql, ...args) => stmt(db, sql, ...args).run();
var first = (db, sql, ...args) => stmt(db, sql, ...args).first();
var all = async (db, sql, ...args) => (await stmt(db, sql, ...args).all()).results;
var text = (v, min = 0, max = 500) => {
  if (typeof v !== "string" || v.trim().length < min || v.length > max) fail(400, `Preencha os campos corretamente (at\xE9 ${max} caracteres).`);
  return v.trim();
};
var email = (v) => {
  v = text(v, 3, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) fail(400, "Informe um e-mail v\xE1lido.");
  return v;
};
var password = (v) => {
  if (typeof v !== "string" || v.length < 12 || bcryptjs_default.truncates(v)) fail(400, "Use uma senha com pelo menos 12 caracteres e no m\xE1ximo 72 bytes.");
  return v;
};
var cleanUser = (u) => ({ id: u.id, email: u.email, name: u.name, role: u.role, status: u.status, created: u.created });
var audit = (db, u, action, target) => stmt(db, "INSERT INTO audit(id,actor,action,target,created) VALUES(?,?,?,?,?)", uid(), u.id, action, target, now());
var readRecord = (r) => ({ ...JSON.parse(r.body), id: r.id, kind: r.kind, status: r.status, revision: r.revision, updated: r.updated });
function urlValue(v) {
  if (!v) return "";
  let u;
  try {
    u = new URL(v);
  } catch {
    fail(400, "Informe um endere\xE7o HTTPS v\xE1lido.");
  }
  if (u.protocol !== "https:" || u.username || u.password) fail(400, "Use um endere\xE7o HTTPS sem credenciais.");
  return u.href;
}
function videoSource(value) {
  const s = urlValue(value);
  if (!s) return null;
  const u = new URL(s), host = u.hostname.toLowerCase();
  if (["www.youtube.com", "youtube.com", "youtu.be", "www.youtube-nocookie.com"].includes(host)) {
    const id = host === "youtu.be" ? u.pathname.slice(1) : u.searchParams.get("v") || u.pathname.split("/").pop();
    if (!/^[a-zA-Z0-9_-]{11}$/.test(id)) fail(400, "Link do YouTube inv\xE1lido.");
    return { type: "iframe", url: "https://www.youtube-nocookie.com/embed/" + id };
  }
  if (["vimeo.com", "www.vimeo.com", "player.vimeo.com"].includes(host)) {
    const id = u.pathname.split("/").filter(Boolean).pop();
    if (!/^\d+$/.test(id)) fail(400, "Link do Vimeo inv\xE1lido.");
    return { type: "iframe", url: "https://player.vimeo.com/video/" + id };
  }
  if (/\.mp4$/i.test(u.pathname)) return { type: "video", url: s };
  fail(400, "Use um v\xEDdeo do YouTube, Vimeo ou um arquivo MP4 em HTTPS.");
}
async function body(req) {
  const raw = await req.text();
  if (raw.length > 1e5) fail(413, "Conte\xFAdo muito grande.");
  try {
    return JSON.parse(raw);
  } catch {
    fail(400, "Dados inv\xE1lidos.");
  }
}
async function rate(db, key, max = 12) {
  const t = now();
  const row = await stmt(db, "INSERT INTO limits(key,count,until) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN until<? THEN 1 ELSE count+1 END,until=CASE WHEN until<? THEN excluded.until ELSE until END RETURNING count", key, t + 900, t, t).first();
  if (row.count > max) fail(429, "Muitas tentativas. Aguarde 15 minutos e tente novamente.");
}
async function session(req, db) {
  const raw = req.headers.get("cookie") || "";
  const value = raw.split(";").map((s) => s.trim()).find((s) => s.startsWith(cookieName + "="))?.slice(cookieName.length + 1);
  if (!value || !/^[a-f0-9]{64}$/.test(value)) return null;
  return first(db, "SELECT users.*,sessions.token AS session_token FROM sessions JOIN users ON users.id=sessions.user_id WHERE sessions.token=? AND sessions.expires>? AND users.status=?", await hash2(value), now(), "active");
}
async function loginResponse(db, u) {
  const value = token();
  await db.batch([stmt(db, "DELETE FROM sessions WHERE expires<?", now()), stmt(db, "INSERT INTO sessions(token,user_id,expires) VALUES(?,?,?)", await hash2(value), u.id, now() + 86400)]);
  return json({ user: cleanUser(u) }, 200, { "Set-Cookie": `${cookieName}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400` });
}
async function initializeCatalog(db, u) {
  const statements = seed_default.map((r) => stmt(db, "INSERT OR IGNORE INTO records(id,kind,body,status,revision,updated) VALUES(?,?,?,?,1,?)", r.id, r.kind, JSON.stringify(r.body), r.status, now()));
  for (let i = 0; i < statements.length; i += 30) await db.batch(statements.slice(i, i + 30));
}
async function validateRecord(db, kind, b, status, id) {
  const base = { title: text(b.title, 1, 160), description: text(b.description || "", 0, 1e4), order: Number.isInteger(Number(b.order)) ? Number(b.order) : 0 };
  if (base.order < 0 || base.order > 1e4) fail(400, "Ordem inv\xE1lida.");
  if (kind === "module") return { ...base, category: text(b.category || "CURSOS", 1, 80), symbol: text(b.symbol || "\u25C7", 1, 8) };
  if (kind === "lesson") {
    const moduleId = text(b.moduleId, 1, 100);
    const m = await first(db, "SELECT id FROM records WHERE id=? AND kind=? AND status<>?", moduleId, "module", "archived");
    if (!m) fail(400, "Selecione um m\xF3dulo ativo.");
    const video = videoSource(b.videoUrl || "");
    if (status === "published" && !video) fail(400, "Insira o v\xEDdeo antes de publicar a aula.");
    const tasks = Array.isArray(b.tasks) ? b.tasks.map((t) => ({ id: text(t.id || uid(), 1, 100), title: text(t.title, 1, 300) })) : [];
    if (tasks.length > 30 || new Set(tasks.map((t) => t.id)).size !== tasks.length) fail(400, "Tarefas inv\xE1lidas.");
    return { ...base, moduleId, videoUrl: urlValue(b.videoUrl || ""), video, duration: Math.max(0, Math.min(999, Number(b.duration) || 0)), tasks };
  }
  if (kind === "track") {
    if (!Array.isArray(b.groups) || b.groups.length > 25) fail(400, "Organize as etapas da trilha.");
    const groups = [];
    for (const g of b.groups) {
      if (!Array.isArray(g) || !Array.isArray(g[1]) || g[1].length > 30) fail(400, "Etapa inv\xE1lida.");
      const ids = [...new Set(g[1])];
      for (const mid of ids) {
        if (typeof mid !== "string" || !await first(db, "SELECT id FROM records WHERE id=? AND kind=? AND status<>?", mid, "module", "archived")) fail(400, "A etapa cont\xE9m um m\xF3dulo indispon\xEDvel.");
      }
      groups.push([text(g[0], 1, 160), ids]);
    }
    if (status === "published" && (!groups.length || !groups.some((g) => g[1].length))) fail(400, "Adicione m\xF3dulos antes de publicar a trilha.");
    return { ...base, name: base.title, tag: text(b.tag || "SUA JORNADA", 0, 100), groups };
  }
  if (kind === "event") {
    const start = Date.parse(b.start), end = Date.parse(b.end);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) fail(400, "Informe in\xEDcio e t\xE9rmino v\xE1lidos.");
    return { ...base, start: new Date(start).toISOString(), end: new Date(end).toISOString(), host: text(b.host || "", 0, 160), location: text(b.location || "", 0, 300), joinUrl: urlValue(b.joinUrl || "") };
  }
  fail(400, "Tipo de conte\xFAdo inv\xE1lido.");
}
async function api(req, env, path) {
  const db = env.DB;
  if (!db) fail(503, "O armazenamento est\xE1 indispon\xEDvel. Tente novamente.");
  const method = req.method;
  if (!["GET", "HEAD"].includes(method)) {
    if (req.headers.get("Origin") !== new URL(req.url).origin || req.headers.get("X-Partiu-Request") !== "1") fail(403, "Solicita\xE7\xE3o n\xE3o autorizada. Atualize a p\xE1gina.");
    if (!req.headers.get("content-type")?.startsWith("application/json")) fail(415, "Use dados JSON.");
  }
  if (path === "/api/auth/status") {
    const count = await first(db, "SELECT count(*) AS n FROM users");
    const owner = req.headers.get("oai-authenticated-user-email")?.toLowerCase();
    return json({ setup: count.n === 0 && !!env.OWNER_EMAIL && owner === env.OWNER_EMAIL.toLowerCase() });
  }
  if (path === "/api/auth/setup" && method === "POST") {
    if (!env.OWNER_EMAIL || req.headers.get("oai-authenticated-user-email")?.toLowerCase() !== env.OWNER_EMAIL.toLowerCase()) fail(403, "A configura\xE7\xE3o inicial est\xE1 dispon\xEDvel somente ao propriet\xE1rio.");
    const b = await body(req), name = text(b.name, 2, 120), pw = password(b.password), mail = env.OWNER_EMAIL.toLowerCase();
    const u2 = { id: "owner", email: mail, name, password: await bcryptjs_default.hash(pw, 12), role: "admin", status: "active", created: now() };
    const r = await run(db, "INSERT INTO users(id,email,name,password,role,status,created) SELECT ?,?,?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM users)", u2.id, u2.email, u2.name, u2.password, u2.role, u2.status, u2.created);
    if (!r.meta.changes) fail(409, "A conta administradora j\xE1 foi configurada. Entre com sua senha.");
    await initializeCatalog(db, u2);
    return loginResponse(db, u2);
  }
  if (path === "/api/auth/login" && method === "POST") {
    const b = await body(req), mail = email(b.email);
    await rate(db, "login:" + await hash2(mail));
    await rate(db, "ip:" + await hash2(req.headers.get("cf-connecting-ip") || "unknown"), 60);
    const u2 = await first(db, "SELECT * FROM users WHERE email=?", mail);
    const pw = typeof b.password === "string" && b.password.length <= 200 ? b.password : "";
    const valid = await bcryptjs_default.compare(pw, u2?.password || "$2b$12$C6UzMDM.H6dfI/f/IKcEe.5SX2x4lqReGVSjtZKfX9NbTXMC63eEq");
    if (!u2 || !valid || u2.status !== "active") fail(401, "E-mail ou senha inv\xE1lidos, ou acesso suspenso.");
    return loginResponse(db, u2);
  }
  if (path === "/api/auth/activate" && method === "POST") {
    const b = await body(req);
    await rate(db, "activate:" + await hash2(req.headers.get("cf-connecting-ip") || "unknown"), 30);
    const t = text(b.token, 64, 64), name = text(b.name, 2, 120), pw = password(b.password);
    const inv = await first(db, "SELECT * FROM invites WHERE token=? AND used=0 AND expires>?", await hash2(t), now());
    if (!inv) fail(400, "Este link expirou ou j\xE1 foi utilizado. Solicite um novo ao administrador.");
    const stored = await bcryptjs_default.hash(pw, 12);
    const existing = await first(db, "SELECT * FROM users WHERE email=?", inv.email);
    if (inv.kind === "reset" && !existing) fail(400, "Conta n\xE3o encontrada.");
    if (inv.kind === "invite" && existing) fail(409, "Esta conta j\xE1 existe. Use a recupera\xE7\xE3o de acesso.");
    const used = await run(db, "UPDATE invites SET used=1 WHERE token=? AND used=0 AND expires>?", inv.token, now());
    if (!used.meta.changes) fail(409, "Link j\xE1 utilizado.");
    const id = existing?.id || uid();
    await db.batch([inv.kind === "reset" ? stmt(db, "UPDATE users SET password=? WHERE id=?", stored, id) : stmt(db, "INSERT INTO users(id,email,name,password,role,status,created) VALUES(?,?,?,?,?,?,?)", id, inv.email, name, stored, inv.role, "active", now()), stmt(db, "DELETE FROM sessions WHERE user_id=?", id)]);
    return json({ ok: true, message: "Senha definida. Entre com seu e-mail." });
  }
  const u = await session(req, db);
  if (!u) fail(401, "Entre na sua conta para continuar.");
  if (path === "/api/auth/me" && method === "GET") return json({ user: cleanUser(u) });
  if (path === "/api/auth/logout" && method === "POST") {
    await run(db, "DELETE FROM sessions WHERE token=?", u.session_token);
    return json({ ok: true }, 200, { "Set-Cookie": `${cookieName}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0` });
  }
  if (path === "/api/profile" && method === "PUT") {
    const b = await body(req);
    await run(db, "UPDATE users SET name=? WHERE id=?", text(b.name, 2, 120), u.id);
    return json({ ok: true });
  }
  if (path === "/api/password" && method === "PUT") {
    const b = await body(req);
    await rate(db, "password:" + u.id);
    if (!await bcryptjs_default.compare(String(b.current || ""), u.password)) fail(400, "A senha atual est\xE1 incorreta.");
    await db.batch([stmt(db, "UPDATE users SET password=? WHERE id=?", await bcryptjs_default.hash(password(b.password), 12), u.id), stmt(db, "DELETE FROM sessions WHERE user_id=? AND token<>?", u.id, u.session_token)]);
    return json({ ok: true });
  }
  if (path === "/api/catalog" && method === "GET") {
    const rows = (await all(db, "SELECT * FROM records WHERE kind IN ('track','module','lesson','event') AND status='published'")).map(readRecord);
    const modules = new Set(rows.filter((r) => r.kind === "module").map((r) => r.id));
    return json({ records: rows.filter((r) => r.kind !== "lesson" || modules.has(r.moduleId)).map((r) => r.kind === "track" ? { ...r, groups: r.groups.map((g) => [g[0], g[1].filter((id) => modules.has(id))]) } : r) });
  }
  if (path === "/api/learner" && method === "GET") return json({ data: Object.fromEntries((await all(db, "SELECT key,value FROM learner WHERE user_id=?", u.id)).map((r) => [r.key, JSON.parse(r.value)])) });
  if (path === "/api/learner" && method === "PUT") {
    const b = await body(req), key = text(b.key, 1, 150);
    if (!/^(note|complete|favorite|task|active|history):[a-zA-Z0-9_-]{1,100}$/.test(key)) fail(400, "Registro inv\xE1lido.");
    const value = key.startsWith("note:") ? text(b.value, 0, 2e4) : b.value;
    if (!key.startsWith("note:") && typeof value !== "boolean" && typeof value !== "string" && typeof value !== "number") fail(400, "Valor inv\xE1lido.");
    if (JSON.stringify(value).length > 21e3) fail(400, "Conte\xFAdo muito grande.");
    if (key.startsWith("complete:") || key.startsWith("note:")) {
      const lesson = await first(db, "SELECT * FROM records WHERE id=? AND kind='lesson' AND status='published'", key.split(":")[1]);
      if (!lesson) fail(400, "Aula indispon\xEDvel.");
      const m = JSON.parse(lesson.body).moduleId;
      if (!await first(db, "SELECT id FROM records WHERE id=? AND status='published'", m)) fail(400, "M\xF3dulo indispon\xEDvel.");
    }
    await run(db, "INSERT INTO learner(user_id,key,value,updated) VALUES(?,?,?,?) ON CONFLICT(user_id,key) DO UPDATE SET value=excluded.value,updated=excluded.updated", u.id, key, JSON.stringify(value), now());
    return json({ ok: true });
  }
  if (path === "/api/questions" && method === "GET") {
    const rows = await all(db, "SELECT * FROM records WHERE kind='question'");
    return json({ questions: rows.map(readRecord).filter((r) => r.studentId === u.id) });
  }
  if (path === "/api/questions" && method === "POST") {
    const b = await body(req), lessonId = text(b.lessonId, 1, 100);
    if (!await first(db, "SELECT id FROM records WHERE id=? AND kind='lesson' AND status='published'", lessonId)) fail(400, "Aula indispon\xEDvel.");
    await rate(db, "question:" + u.id, 30);
    const id = uid();
    await run(db, "INSERT INTO records(id,kind,body,status,revision,updated) VALUES(?,?,?,?,1,?)", id, "question", JSON.stringify({ studentId: u.id, studentName: u.name, lessonId, text: text(b.text, 3, 4e3), answer: "" }), "open", now());
    return json({ ok: true });
  }
  if (!path.startsWith("/api/admin/")) fail(404, "P\xE1gina n\xE3o encontrada.");
  if (u.role !== "admin") fail(403, "Este recurso \xE9 exclusivo da administra\xE7\xE3o.");
  if (path === "/api/admin/records" && method === "GET") return json({ records: (await all(db, "SELECT * FROM records ORDER BY updated DESC")).map(readRecord) });
  if (path === "/api/admin/records" && method === "POST") {
    const b = await body(req), kind = text(b.kind, 1, 20), id = uid(), status = ["draft", "published"].includes(b.status) ? b.status : "draft";
    const record = await validateRecord(db, kind, b, status, id);
    await db.batch([stmt(db, "INSERT INTO records(id,kind,body,status,revision,updated) VALUES(?,?,?,?,1,?)", id, kind, JSON.stringify(record), status, now()), audit(db, u, "create", id)]);
    return json({ id });
  }
  if (path.startsWith("/api/admin/records/") && method === "PUT") {
    const id = path.split("/").pop(), b = await body(req), old = await first(db, "SELECT * FROM records WHERE id=?", id);
    if (!old) fail(404, "Conte\xFAdo n\xE3o encontrado.");
    if (old.kind === "question") {
      const content2 = { ...JSON.parse(old.body), answer: text(b.answer, 1, 6e3) };
      const r2 = await run(db, "UPDATE records SET body=?,status=?,revision=revision+1,updated=? WHERE id=? AND revision=?", JSON.stringify(content2), "answered", now(), id, b.revision);
      if (!r2.meta.changes) fail(409, "O registro foi alterado. Atualize a p\xE1gina.");
      return json({ ok: true });
    }
    if (!["draft", "published", "archived"].includes(b.status)) fail(400, "Estado inv\xE1lido.");
    const content = await validateRecord(db, old.kind, b, b.status, id);
    const r = await run(db, "UPDATE records SET body=?,status=?,revision=revision+1,updated=? WHERE id=? AND revision=?", JSON.stringify(content), b.status, now(), id, b.revision);
    if (!r.meta.changes) fail(409, "Outra edi\xE7\xE3o foi salva. Reabra o registro antes de tentar novamente.");
    await audit(db, u, "update:" + b.status, id).run();
    return json({ ok: true });
  }
  if (path === "/api/admin/users" && method === "GET") {
    const users = (await all(db, "SELECT id,email,name,role,status,created FROM users ORDER BY created DESC")).map(cleanUser);
    return json({ users, invites: await all(db, "SELECT email,role,kind,expires,used FROM invites WHERE expires>? ORDER BY expires DESC", now()) });
  }
  if (path.startsWith("/api/admin/users/") && method === "PUT") {
    const id = path.split("/").pop(), b = await body(req);
    if (id === u.id || id === "owner") fail(400, "A conta propriet\xE1ria e sua pr\xF3pria permiss\xE3o n\xE3o podem ser alteradas aqui.");
    if (!["admin", "student"].includes(b.role) || !["active", "suspended"].includes(b.status)) fail(400, "Perfil inv\xE1lido.");
    if (!await first(db, "SELECT id FROM users WHERE id=?", id)) fail(404, "Conta n\xE3o encontrada.");
    await db.batch([stmt(db, "UPDATE users SET role=?,status=? WHERE id=?", b.role, b.status, id), stmt(db, "DELETE FROM sessions WHERE user_id=?", id), audit(db, u, "user:" + b.role + ":" + b.status, id)]);
    return json({ ok: true });
  }
  if (path === "/api/admin/invites" && method === "POST") {
    const b = await body(req), mail = email(b.email), kind = b.kind === "reset" ? "reset" : "invite", role = b.role === "admin" ? "admin" : "student";
    const existing = await first(db, "SELECT * FROM users WHERE email=?", mail);
    if (kind === "invite" && existing) fail(409, "Este e-mail j\xE1 tem uma conta.");
    if (kind === "reset" && !existing) fail(404, "Conta n\xE3o encontrada.");
    const raw = token(), expires = now() + 86400;
    await db.batch([stmt(db, "UPDATE invites SET used=1 WHERE email=?", mail), stmt(db, "INSERT INTO invites(token,email,role,kind,expires,used) VALUES(?,?,?,?,?,0)", await hash2(raw), mail, existing?.role || role, kind, expires), audit(db, u, kind, mail)]);
    return json({ token: raw, expires, email: mail });
  }
  if (path === "/api/admin/audit" && method === "GET") return json({ entries: await all(db, "SELECT audit.*,users.name AS actorName FROM audit LEFT JOIN users ON users.id=audit.actor ORDER BY audit.created DESC LIMIT 100") });
  fail(404, "Recurso n\xE3o encontrado.");
}
var worker_default = { async fetch(req, env) {
  const path = new URL(req.url).pathname;
  try {
    if (path.startsWith("/api/")) return await api(req, env, path);
    if (!["GET", "HEAD"].includes(req.method)) return new Response("Method not allowed", { status: 405 });
    const asset = assets_generated_default[path === "/" ? "/index.html" : path];
    if (!asset) return new Response("Not found", { status: 404 });
    return new Response(req.method === "HEAD" ? null : asset.body, { headers: { "Content-Type": asset.type, "Cache-Control": "no-cache", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer", "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https:; frame-src https://www.youtube-nocookie.com https://player.vimeo.com; media-src https:; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'self' https://chatgpt.com https://*.chatgpt.com" } });
  } catch (e) {
    if (!e.status) console.error("Request failed", path, e.message);
    return json({ error: e.status ? e.message : "N\xE3o foi poss\xEDvel concluir. Seus dados permanecem no formul\xE1rio; tente novamente." }, e.status || 503);
  }
} };
export {
  worker_default as default,
  videoSource
};
