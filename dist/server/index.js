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
`, "type": "text/javascript; charset=utf-8" }, "/index.html": { "body": '<!doctype html>\n<html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Arrivo In It\xE1lia: trilhas de conhecimento para planejar sua cidadania, sua mudan\xE7a e sua vida na It\xE1lia."><title>Arrivo In It\xE1lia \xB7 Sua pr\xF3xima etapa</title><link rel="icon" type="image/jpeg" href="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/4QJmRXhpZgAATU0AKgAAAAgAAodpAAQAAAABAAABMuocAAcAAAEMAAAAJgAAAAAc6gAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKQAAAHAAAABDAyMjDqHAAHAAABDAAAAVAAAAAAHOoAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+EB3Wh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8APD94cGFja2V0IGJlZ2luPSfvu78nIGlkPSdXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQnPz4NCjx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iPjxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyIvPjwveDp4bXBtZXRhPg0KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDw/eHBhY2tldCBlbmQ9J3cnPz7/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAJqApoDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9U6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiikoAWiiigAooooAKKKKACiiigApD2paTIoAWikpaACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKQ9qWigAooooAKKKKACiiigAoopKAFooooAKKKKACiiigAooooAKKSloAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigBGzjiqGoaat5HlTskHfFaFIRxQBySM9tIY5fvDvjrVoXXHWtTU9PF9EcYVx0audaG5RipiJI4NVcmx2VFFFSUFFFFABRRSN0oAKWmr1p1ABRRRQAUUUUAFFFFABSUUYoAD2paKKACiiigAoopM0ALRSZoJ6UALSYpaKAEpaKKACiiigAooooAKKKKACiiigAooooAKKKKACkpaSgBaTNLSYoAKWkAxS0AFFFFABRRSUALRRRQAUlLRQAUUUUAFFFFABRSZ5paACkbpR3paAGr1p1JS0AFFFFABRRSUALRRRQAUUh6UgPNADqKKKACiiigAooooAKKKKACiiigBrAbSKTC+lOpaACkpaSgAIpADSkUnIoADx3pRyKTqKADQApHpQM0YpaACiiigAooooAQ9KQc0pGaTBoAXFFIAaXFABiloooAKKKKACkIpaQ0ANxSgUAGlxQAYpaKKACiiigAooooATvQaMUY9zQAgBpcUYpaACiiigAooooAKKQ0mDQApoI4pORQMmgB1FFFABRRRQAUUUUAI3Sm04jNNxigBRzS4pAKXHvQAtFFFABRRRQAUUUhoADxQB70hzSgUAGKMUtFABRRRQAUUUUAI3Sm04jNJg0AByB1oHNHPeloACOlGKWigAoopKAFpKWkPSgAIpORRyaMGgAHNLikAwadQAUUUUAFFFFABRSd6QdaAFNIc06igBAKWiigAooooAKKKSgBaQ9KWigBo5pcUYoxQAtFFFABRRRQAUUUUAJ3opaKAExS0UUAFFFFABRRRQAUUlLQAneloooAKKKKACiiigApKWigBMUUtFACYoxS0UAJiloooAKKKKACkPSlooAaOtOpKD2oAWiiigAooooAKKKKACkpaKAEI6UtFFABRRRQAUUUUAFFFFACUY9zS0UAIRS0UUAFFFFABSHilooAaOtKRmiloAbg0AGnUUAJiloooAKKKKACiiigApKWigAooooAKKKKACiiigApKWigBKMUtFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAJS0UUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRSUALRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUnelooAKKKKACiiigAooooAKKKKACikPaloAKKKKACiiigAooooAKKKKAEPaloooAKKKKACiiigAoopKAFopOneigBaKKKACiiigAooooAKKKKAE4o4oxRQAtFFFABRRRQAUUlLQAUlLSUALRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRSE0ABOKWmjk06gAooooAKKKKACikNJg0AOopuDRg0AOopMH1oxQAtFFFABRRRQAUUhpMGgBaMUnNKM0ALRRRQAUUUUAFFFNPWgB1FN5NGDQA6k70nNKAc0ALRRRQAUUUUAFFIelJyaAFoxSAGlx7mgAPaigjpS0AFFFFABRRSGgBaKbg0YNADqKbg0ozQAtFFFABRRRQAUUlIeO9AC0tN7UDmgB1FJiloAKKKKACiikPSgBaKbyaADQA6koxS0AJiloooAKKKKACkpaaetAC4opOTRg0ALj3NGKQA0uKAFooooAKKKKACikPWk5oADyaMGlAOaKAEAwadSYpaACiiigApD2o70UAB6U3NPpMUAIDzSntRiloASjFLRQAUUUUAFJ3paKAENAzS0h7UALRRRQAUUUUAFFFFABTW606koAQdaXFFLQAUUUUAFFFFABRRRQAjdKRetOpKACjFLRQAUUUUAFFFFACd6D0paKAGZpR1pSOlFAC0UUUAFFFFABRRRQAh6U3k05ulNHWgBQKWlooASjFLRQAUUUUAJ3obpS0jdKAG0o60oHFFAC0UUUAFFFFABRRRQAh6U2n0mKAGinDNFLQAUUUUAFFFFABSHpS0jdKAG5pR1oHWloAWkPalooAKKKKACiiigBKOKWkPagBaKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigBO9FFB7UALRRSGgBaKTPvUU0vlru3KuPWgTaWrJqK4nxd8XvCXgQf8AE/8AEWn6Uw58u4uEV2Hsmdx/AV5Vqv7d3wr06Rki1S81EqcE2djIR+bACpcordnBUzDDUnac0fRdFfLzf8FBvhurHEWtkev2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2KMUrMYzA9KXFOxRijUBuKTA9KfijFGohtHanYHpRiiwxv4UDinYoxRYBuM0BcEk4p2KWjYVhMDOeM+tAoxRTGLRRRQAUUlLQAU1ulOooAZ+FJls9KfijFAhnPpRyPen4oxQFhhJ9KQZPUYqQ4HajAoCwzGOlKo56U7FFAxaKKKACiiigAooooAKKKQ9qAClpKWgAooooAKKKTvQAtFFIaAFopvNOoAKKKKACiiigAopKWgApO9LSUAFLSUtABRRRQAUUUUAFFJS0AFFFJ3oAWiiigAooooAKKKKACkpaTvQAHtS0h7UtABRRRQAUUUUAFFJS0AJ3opaKACiiigAooooAKKKTvQAtJS0lAC0Uh7UtABRRRQAUUUUAFFFFABRRSHpQAUtNHWnUAFFFFABRRSUALRRRQAlFBGaAMUALRRRQAUUUUAFFJ3oJoAWimjrTqAEpaSloAKKKKACk70tFACGkANLQRQAh470DmjBoAwaAFxRilooAKKKKACikoIoACPSkANGDRg0ALiloooAKKKKACiiigApCM0tJQAmCKB1pSKTBoAdSHtSc06gAooooAKKKSgANIAaUikwaAFxS00A0uKAFooooAKKKKACkIzS0negBAKDx3pSKTB70AA5pcUAYpaACiiigBKWkpaAEPSk5NKRmkwaADkUDrRg96XFAC0UmKWgAooooAKSlpKADFB6UEUgB70AKBS0mKWgBKWiigAoopD2oAG6U2nN0ptACjmlx7mkHWlxQAYpaKKACkpaSgBaKKKAGdaUCjB7UozQAAYpaKKACiiigAooooAKKKKAEox7miloATFLRRQAUUUUAFFFFACUY9zS0h7UAGKWiigAooooAKKKKACiik70AFGPc0tFACYpaKKACiiigAooooAKSlooATFFFGKADHuaMUtFABRRRQAh7UtJRQAHpSDrTqSgAoxS0UAFFFFABRRRQAUUUUAFFFFACUYpaKACiiigAooooAKKKKACiiigAooooAKKKKAEoxS0UAJijFLRQAgGKWiigAooooAKKKKACkpaKAExRS0UAJiloooAKKKKACiiigAooooASloooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACkpaKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAEoxS0UAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRSd6WgAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAoopM0ALRSUtABRRRQAUUUUAFFFFABRRSd6AFooooAKKKKACiiigAoopKAFooooAKKKKACiiigAooooAKKSloAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAoopKAFooooAKKKKACiiigAopO9B6UALRTM0ZoAfRTM0o60AOooooAKKKQ9KAFopmaM0AO70Y9zTc0ZoAdilpoPNOoAKKKKACik70HpQAtJTc0ZoAdig9qbmlHWgB1FFFABRRRQAUU09aTNAD6TFNzRmgBx7UtNHWnUAFFFFABRSHpTc0APopmaM0APopmaM0APopo606gAooooAKKKZmgB9JTc0ZoAd3paaOtOoAKKKKACiikPSgBaQjNNzS9qAFAxQabmlHWgB1FFFABRRRQAUlDdKbQA+imZozQA+imZpR1oAdRRRQAUUUUAFJ3puaM0APpKbmjNAD6KQdKWgAooooA//2Q=="><link rel="stylesheet" href="style.css"><link rel="stylesheet" href="theme-italia.css"><link rel="stylesheet" href="platform.css"><script src="app.js" defer><\/script></head><body><a class="skip" href="#main">Ir para o conte\xFAdo</a><header><a class="brand" href="#inicio"><span class="brandmark">a<span>\u2197</span></span><span>Arrivo<span class="italia">In It\xE1lia<span class="flag">\u25B0 \u25B0 \u25B0</span></span></span></a><nav aria-label="Navega\xE7\xE3o principal"><a href="#inicio" data-nav="inicio">\u2302 <span>In\xEDcio</span></a><a href="#agenda" data-nav="agenda">\u25A6 <span>Agenda</span></a><a href="#favoritos" data-nav="favoritos">\u2606 <span>Favoritos</span></a><a href="#historico" data-nav="historico">\u25F7 <span>Hist\xF3rico</span></a><a href="#suporte" data-nav="suporte">\u2661 <span>Suporte</span></a></nav><span class="preview-label">PR\xC9VIA DO APLICATIVO</span><span class="avatar" aria-label="Perfil visitante">V</span></header><div class="journeybar"><div class="learner"><span class="mini-avatar">\u2726</span><span><small>Sua jornada come\xE7a aqui</small><strong>Explorador</strong></span></div><div class="xp"><div><span>Seu pr\xF3ximo destino: conhecimento</span><strong id="xp-count">0 XP</strong></div><progress id="xp" max="100" value="0" aria-label="Experi\xEAncia"></progress></div><a class="active-path" href="#trilha/cidadania"><span>\u2667</span><span><small>Explore uma trilha</small><strong id="active-name">Reconhecer minha cidadania</strong></span><span>\u203A</span></a></div><main id="main" tabindex="-1"></main><footer><a class="brandtext" href="#inicio">Arrivo In It\xE1lia \u2197</a><span>Um passo de cada vez. Uma nova vida pela frente.</span><small>Pr\xE9via \xB7 Aulas em produ\xE7\xE3o</small><a class="credit" href="https://commons.wikimedia.org/wiki/File:Landscape_in_Val_d%27Orcia.jpg" target="_blank" rel="noopener">Foto: Salvatore Gerace \xB7 CC BY 2.0 \xB7 recorte</a></footer><div id="toast" role="status"></div><dialog id="detail"><button class="close" aria-label="Fechar">\xD7</button><div id="dialog-content"></div></dialog></body></html>\n', "type": "text/html; charset=utf-8" }, "/platform.css": { "body": ".account-nav{display:flex;gap:8px;align-items:center;margin-left:auto}.account-nav a{font-size:12px;padding:8px;border-radius:8px;background:#e5efe6}.account-nav button{font-size:12px;padding:8px;border:1px solid #d9e4da;border-radius:8px;background:#fff}.account-nav .avatar{width:auto;padding:8px 12px;border-radius:8px}.auth-shell{max-width:480px;margin:45px auto;padding:30px;background:#fffdf9;border:1px solid #e0e8de;border-radius:16px;box-shadow:0 12px 30px #354a3910}.auth-shell h1{font:800 27px Manrope}.form{display:grid;gap:17px}.form label{display:grid;gap:7px;font-size:14px;font-weight:600}.form input,.form select,.form textarea,.filter-select{width:100%;border:1px solid #cddcd0;border-radius:7px;padding:11px;background:#fff;color:#304638;font-size:14px}.form textarea{min-height:90px}.form .row{display:grid;grid-template-columns:1fr 1fr;gap:17px}.form small{font-weight:400;font-size:12px;color:#69766d;line-height:1.6}.form-error{color:#a33232;line-height:1.6;font-size:14px}.form-success{color:#34765c}.form .checkline{display:flex;align-items:center;gap:10px;font-weight:400}.checkline input{width:17px}.form-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.management{display:grid;grid-template-columns:200px minmax(0,1fr);gap:26px;max-width:1280px;margin:auto;padding:32px}.admin-menu{background:#fffc;border:1px solid white;border-radius:12px;padding:15px;height:fit-content;display:grid;gap:5px}.admin-menu a{padding:11px;font-size:14px;border-radius:7px}.admin-menu a.active{background:#dfeddf;color:#2d6a45;font-weight:700}.admin-menu h2{font:700 17px Manrope;padding:0 10px}.admin-head{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-bottom:22px}.admin-head h1{font:800 27px Manrope;margin:0}.admin-head p{font-size:13px;color:#6d786d;line-height:1.6}.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-bottom:25px}.metric{background:#fffdf9;border:1px solid #dfe6db;padding:22px;border-radius:11px}.metric strong{display:block;font-size:32px;color:#3b7752}.metric span{font-size:13px;color:#6b796c}.table-wrap{overflow:auto;background:#fffdfb;border:1px solid #dfe7dc;border-radius:10px}table{border-collapse:collapse;width:100%;font-size:14px}th,td{text-align:left;padding:15px;border-bottom:1px solid #e9eee5;vertical-align:middle}th{color:#697567;font-weight:500;font-size:12px}td small{display:block;color:#74806f;margin-top:4px}td .outline{white-space:nowrap}.status{display:inline-block;font-size:11px;background:#e9eee7;color:#63745f;padding:5px 9px;border-radius:20px;white-space:nowrap}.status.published,.status.active{background:#dcefdc;color:#326a3b}.status.draft,.status.open{background:#fbefd0;color:#85671b}.status.archived,.status.suspended{background:#f5dedb;color:#944f45}.editor{background:#fffdfbdd;border:1px solid white;padding:25px;border-radius:12px}.section-builder{border:1px solid #d9e5d6;padding:17px;border-radius:9px;margin:12px 0}.section-builder .module-options{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0;max-height:240px;overflow:auto}.module-choice{display:grid;grid-template-columns:20px 1fr 62px;align-items:center;gap:8px;font-size:13px}.module-choice input[type=number]{padding:5px}.admin-notice{background:#f5ebdb;padding:16px;border-radius:9px;font-size:13px;line-height:1.7;margin:20px 0}.profile-grid{display:grid;grid-template-columns:1fr 1fr;gap:25px}.loading{padding:70px;text-align:center;color:#687c68}.video-player{width:100%;aspect-ratio:16/9;border:0;border-radius:12px;background:#1e3025}.question{background:#fffdfc;padding:18px;border:1px solid #e0e8dc;border-radius:9px;margin:12px 0;font-size:14px;line-height:1.7;white-space:pre-wrap}.question .answer{margin-top:15px;padding:12px;background:#edf5eb;border-radius:6px}.event-row{display:flex;gap:20px;align-items:center;background:#fffdfb;padding:22px;margin:12px 0;border:1px solid #e1e7db;border-radius:11px}.event-row .date{color:#4b7e57;font-size:14px;min-width:95px}.event-row h2{font-size:17px;margin:0 0 5px}.event-row .outline{margin-left:auto}.danger{color:#a34d46!important;border-color:#e0bbb5!important}.auth-shell>.brandtext{font-size:22px}.form button:disabled{opacity:.65}.section-builder .section-heading{display:flex;gap:10px;align-items:center}.section-builder .section-heading input{flex:1}.profile-avatar{display:grid;place-items:center;width:65px;height:65px;border-radius:50%;background:#ddebdf;color:#42704c;font-size:26px;margin-bottom:18px}.invite-result{word-break:break-all;padding:20px;background:#eff6ec;border:1px solid #d9e4d2;border-radius:10px}.invite-result textarea{min-height:100px}.help{font-size:13px;line-height:1.8;color:#647462}.admin-toolbar{display:flex;gap:12px;margin:15px 0;align-items:center}.admin-toolbar input{padding:10px;border-radius:7px;border:1px solid #d3dfd0;min-width:0;flex:1}.admin-toolbar select{padding:10px;max-width:180px;border-radius:7px;border:1px solid #d3dfd0}.plaincopy{white-space:pre-wrap;line-height:1.8}.cancel-button{border:0;background:none;color:#747d6f;font-size:13px;cursor:pointer}.completion{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:24px 0}.save-state{font-size:12px;color:#74846f}.nav-admin{display:none}.nav-admin.visible{display:inline-block}\n@media(max-width:900px){header{gap:14px;flex-wrap:wrap;height:auto;padding-top:15px;padding-bottom:10px}header nav{margin:0;min-height:40px}.account-nav{margin-left:auto}.management{grid-template-columns:1fr;padding:22px 18px}.admin-menu{display:flex;overflow:auto}.admin-menu h2{display:none}.admin-menu a{white-space:nowrap}.profile-grid{grid-template-columns:1fr}.metrics{grid-template-columns:repeat(2,1fr)}}\n@media(max-width:600px){.account-nav a,.account-nav button{font-size:11px;padding:7px}.auth-shell{margin:25px 16px;padding:23px}.form .row{grid-template-columns:1fr}.admin-head{flex-wrap:wrap}.metrics{grid-template-columns:1fr 1fr}.metric{padding:15px}.metric strong{font-size:25px}.section-builder .module-options{grid-template-columns:1fr}.editor{padding:17px}.event-row{flex-wrap:wrap}.event-row .outline{margin-left:0}.admin-toolbar{flex-wrap:wrap}}\n", "type": "text/css; charset=utf-8" }, "/style.css": { "body": `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');
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
