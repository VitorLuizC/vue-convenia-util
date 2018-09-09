import moment from 'moment';
import normalize, { normalizeDiacritics } from 'normalize-text';

/**
 * Valida se o construtor do valor é o especificado.
 * @example ```
 * (12, 'Number') => true
 * ({ name: 'Lucas' }, 'Object') => true
 * ([2, 3], 'Set') => false
 * ```
 * @param {*} value
 * @param {String} constructor
 * @returns {Boolean}
 */

var is = function (value, constructor) {
  var isEquals = constructor === getConstructor(value);
  return isEquals;
};
var isCPF = function (cpf) {
  var isInvalid = function (cpf, rest, pos) { return rest !== parseInt(cpf.substring(pos, pos + 1)); };

  var sumDigit = function (cpf, digit) { return 11 - cpf.substring(0, digit).split('').reduce(function (acc, curr, index) {
    acc += parseInt(curr) * (digit + 1 - index);
    return acc;
  }, 0) % 11; };

  var getRest = function (sum) { return sum > 9 ? 0 : sum; };

  if (!is(cpf, 'String')) { return false; }
  cpf = cpf.replace(/[\D]/gi, '');
  if (!cpf.match(/^\d+$/)) { return false; }
  if (cpf === '00000000000' || cpf.length !== 11) { return false; }
  if (isInvalid(cpf, getRest(sumDigit(cpf, 9)), 9)) { return false; }
  if (isInvalid(cpf, getRest(sumDigit(cpf, 10)), 10)) { return false; }
  return true;
};
/**
 * Valida se é uma data com o formato especificado ou, quando não especificado,
 * valida se é um dos formatos 'DD/MM/YYYY', 'DD-MM-YYYY' e 'YYYY-MM-DD'.
 * @example ```
 * ('3/102/2006') => false
 * ('31/02/2006') => false
 * ('21/12/2006') => true
 * ('21/12/2006', 'YYYY-MM-DD') => false
 * ```
 * @param {String} date
 * @param {String} [format]
 * @returns {Boolean}
 */

var isDate = function (date, format) {
  if ( format === void 0 ) format = null;

  var from = format || getDateFormat(date);
  var isValid = from ? moment(date, from).isValid() : false;
  return isValid;
};
/**
 * Valida se o valor é um CPNJ válido.
 * @param {String} value
 * @returns {Boolean}
 */

var isCNPJ = function (value) {
  if (!is(value, 'String')) {
    return false;
  }

  var digits = value.replace(/[\D]/gi, '');
  var dig1 = 0;
  var dig2 = 0;
  var validation = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  var digito = parseInt(digits.charAt(12) + digits.charAt(13));

  var getRest = function (dig) { return dig % 11 < 2 ? 0 : 11 - dig % 11; };

  validation.map(function (v, i) {
    dig1 += i > 0 ? digits.charAt(i - 1) * v : 0;
    dig2 += digits.charAt(i) * v;
  });
  dig1 = getRest(dig1);
  dig2 = getRest(dig2);
  return dig1 * 10 + dig2 === digito;
};
/**
 * Valida, de forma simples*, se o valor é um email válido.
 * @param {String} value
 * @returns {Boolean}
 */

var isEmail = function (value) {
  var isValid = is(value, 'String') && /^.+@.+\..+$/.test(value);
  return isValid;
};

var validate = /*#__PURE__*/Object.freeze({
  is: is,
  isCPF: isCPF,
  isDate: isDate,
  isCNPJ: isCNPJ,
  isEmail: isEmail
});

/**
 * Obtém o formato da data ou null se não for possível identificar.
 * @example ```
 * ('2000-21-12') => ['YYYY-DD-MM', 'YYYY-MM-DD HH:mm:ss']
 * ('21-12-2000') => ['DD-MM-YYYY', 'DD-MM-YYYY HH:mm:ss']
 * ('21/12/2000 23:59:18') => ['DD/MM/YYYY', 'DD/MM/YYYY HH:mm:ss']
 * ('2000/12/21') => null
 * ```
 * @param {String} date
 * @returns {String}
 */

var getDateFormat = function (date) {
  if (!is(date, 'String') || date.trim().length < 10) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(date)) {
    return ['YYYY-MM-DD', 'YYYY-MM-DD HH:mm:ss'];
  } else if (/^\d{2}-\d{2}-\d{4}/.test(date)) {
    return ['DD-MM-YYYY', 'DD-MM-YYYY HH:mm:ss'];
  } else if (/^\d{2}\/\d{2}\/\d{4}/.test(date)) {
    return ['DD/MM/YYYY', 'DD/MM/YYYY HH:mm:ss'];
  }

  return null;
};
/**
 * Obtém o construtor do valor.
 * @param {*} value
 * @returns {String}
 */

var getConstructor = function (value) {
  var string = Object.prototype.toString.call(value);
  var ref = /\[object (.*?)\]/.exec(string);
  var constructor = ref[1];
  return constructor;
};
/**
 * Usando um valor inicial, encadeia uma função e retorna seu resultado.
 * @param {A} initial
 * @param {function(A):function} callback
 * @param {Array.<*>} params
 * @returns {B}
 * @template A, B
 */

var chain = function (initial, callback, params) {
  var value = params.reduce(function (value, args) {
    return callback(value).apply(value, [].concat( args ));
  }, initial);
  return value;
};
/**
 * Faz em forma de corrente o replace do texto usando os argumentos especificados.
 * @param {String} text
 * @param {Array.<*>} args
 * @returns {String}
 */

var replace = function (text, args) { return chain(text, function (text) { return text.replace; }, args); };

/**
 * Decorador de formatadores. Formata o valor que passar pela função de validação.
 * @param {function():boolean} validator
 * @param {function():T} formatter
 * @returns {function():(null | T)}
 * @template T
 */

var formatFor = function (validator, formatter) { return function () {
  var isValid = validator.apply(null, arguments);
  var formatted = isValid ? formatter.apply(null, arguments) : null;
  return formatted;
}; };
/**
 * Decorador de formatadores. Formata o valor se ele for do tipo declarado.
 * @param {String} type
 * @param {function():T} formatter
 * @returns {function():(null | T)}
 * @template T
 */


var formatForType = function (type, formatter) {
  return formatFor(function (value) { return is(value, type); }, formatter);
};
/**
 * Transforma um valor para a formatação de CPF.
 * @example ```
 * ('00000000000') => '000.000.000-00'
 * ('12345678') => '123.456.78'
 * ('Abacaxi') => null
 * ```
 * @param {String} value
 * @returns {String}
 */


var toCPF = formatForType('String', function (value) {
  var formatted = replace(value, [[/\D/g, ''], [/(\d{3})(\d)/, '$1.$2'], [/(\d{3})(\d)/, '$1.$2'], [/(\d{3})(\d{1,2})$/, '$1-$2']]);
  return formatted;
});
/**
 * Transforma um valor para a formatação de RG.
 * @example ```
 * ('000000000') => '00.000.000-0'
 * ('12345678') => '123.456.78'
 * ('Abacaxi') => null
 * ```
 * @param {String} value
 * @returns {String}
 */

var toRG = formatForType('String', function (value) {
  var formatted = replace(value.toUpperCase(), [[/[^\d|A|B|X]/g, ''], [/(\d{2})(\d)/, '$1.$2'], [/(\d{3})(\d)/, '$1.$2'], [/(\d{3})([\d|A|B|X]{1})$/, '$1-$2']]);
  return formatted;
});
/**
 * Formata um valor para a formatação de moeda.
 * @example ```
 * ('1200') => 'R$ 1.200,00'
 * (15.50) => 'R$ 15,50'
 * ('Abacaxi') => null
 * ```
 * @param {String} value
 * @returns {String}
 */

var toMoney = formatFor(function (value) { return is(value, 'Number') || is(value, 'String') && !isNaN(value); }, function (value) {
  var formatted = 'R$ ' + replace((+value).toFixed(2), [['.', ','], [/(\d)(?=(\d{3})+(?!\d))/g, '$1.']]);
  return formatted;
});
/**
 * Obtém a quantidade de anos a partir da data.
 * @example ```
 * ('21-12-2006') => 10
 * ('2000-12-21') => 16
 * ('Abacaxi') => null
 * ```
 * @param {String} date
 * @returns {Number}
 */

var toYears = function (date) {
  var format = getDateFormat(date);
  var from = format ? moment(date, format) : null;
  var diff = from ? moment().diff(from, 'years') : null;
  var years = is(diff, 'Number') && !isNaN(diff) ? diff : null;
  return years;
};
/**
 * Formata para o formato de dias.
 * @example ```
 * (2) => '2 dias'
 * (1) => '1 dia'
 * (0) => '0 dias'
 * ```
 * @param {Number} value
 * @returns {String}
 */

var toDays = function (value) {
  var isValid = is(value, 'Number') && Number.isFinite(value);
  var formatted = value === 1 ? '1 dia' : ((isValid ? ~~value : 0) + " dias");
  return formatted;
};
/**
 * Formata uma data 'YYYY-MM-DD' ou 'DD-MM-YYYY' em 'DD/MM/YYYY'. Transforma
 * a data em 'YYYY-MM-DD' caso o segundo parâmetro seja "true".
 * @example ```
 * ('21-12-2006') => '21/12/2006'
 * ('2006-12-21') => '21/12/2006'
 * ('21/12/2006') => '21/12/2006'
 * ('21/12/2006', true) => '2006-12-21'
 * ('2006-12-21', true) => '2006-12-21'
 * ('2006/12/21') => null
 * ```
 * @param {String} value
 * @param {{ from: String, to: String, UTC: Boolean }} [options]
 * @returns {String}
 */

var toDate = formatFor(function (value, ref) {
  if ( ref === void 0 ) ref = {};
  var from = ref.from; if ( from === void 0 ) from = getDateFormat(value);

  return from && isDate(value, from);
}, function (value, ref) {
  if ( ref === void 0 ) ref = {};
  var to = ref.to; if ( to === void 0 ) to = 'DD/MM/YYYY';
  var from = ref.from; if ( from === void 0 ) from = getDateFormat(value);
  var isUTC = ref.UTC; if ( isUTC === void 0 ) isUTC = false;

  var formatter = isUTC ? moment.utc : moment;
  var formatted = formatter(value, from).format(to);
  return formatted;
});
/**
 * Usa a formatação de datas para retornar um intervalo.
 * @example ```
 * ({ start: '21-12-2006', end: '31-12-2006' }) => '21/12/2006 a 31/12/2006'
 * ```
 * @param {{ start: String, end: String }} dates
 * @param {{ from: String, to: String }} [options]
 * @returns {String}
 */

var toInterval = function (dates, options) {
  if ( options === void 0 ) options = {};

  var start = dates.start;
  var end = dates.end;
  var interval = (toDate(start, options)) + " a " + (toDate(end, options));
  return interval;
};
/**
 * Faz uma verificação simples e coloca o caractere para vazio caso o valor seja
 * vazio (null, undefined, '').
 * @param {*} value
 * @param {String} char
 * @returns {String}
 */

var toEmpty = function (value, char) {
  if ( char === void 0 ) char = '-';

  return value || char;
};
/**
 * Formata um valor para o formato de telefone.
 * @param {String} value
 * @returns {String}
 */

var toPhone = formatForType('String', function (value) {
  var formatted = replace(value, [[/\D/g, ''], [/(\d{1,2})/, '($1'], [/(\(\d{2})(\d{1,4})/, '$1) $2'], [/( \d{4})(\d{1,4})/, '$1-$2'], [/( \d{4})(?:-)(\d{1})(\d{4})/, '$1$2-$3']]);
  return formatted;
});
/**
 * Formata o texto removendo seus acentos.
 * @example ```
 * ('Vítor') => 'Vitor'
 * ('Olá, tudo bem com você?') => 'Ola, tudo bem com voce?'
 * ```
 * @param {String} value
 * @returns {String}
 */

var toClean = formatForType('String', normalizeDiacritics);
/**
 * Formata um texto o transformando em _kebab-case_.
 * @param {String} value
 * @returns {String}
 */

var toSlug = formatForType('String', function (value) {
  var formatted = replace(normalize(value), [[/&/g, '-e-'], [/\W/g, '-'], [/--+/g, '-'], [/(^-+)|(-+$)/, '']]);
  return formatted;
});
/**
 * Formata um valor para CEP.
 * @param {String} value
 * @returns {Boolean}
 */

var toCEP = formatForType('String', function (value) {
  var formatted = replace(value, [[/\D/g, ''], [/(\d{5})(\d{1,3})/, '$1-$2']]);
  return formatted;
});

var format = /*#__PURE__*/Object.freeze({
  toCPF: toCPF,
  toRG: toRG,
  toMoney: toMoney,
  toYears: toYears,
  toDays: toDays,
  toDate: toDate,
  toInterval: toInterval,
  toEmpty: toEmpty,
  toPhone: toPhone,
  toClean: toClean,
  toSlug: toSlug,
  toCEP: toCEP
});

/**
 * Adiciona o dado isLoading com true, que assim que o componente é montado e a
 * action é executada ele passa a ser false.
 * @param {function(Vue): Promise} action
 */
var Loadable = function (action) { return ({
  data: function data() {
    return {
      isLoading: true
    };
  },

  mounted: function mounted() {
    var this$1 = this;

    (action ? action(this) : Promise.resolve()).then(function () {
      this$1.isLoading = false;
    });
  }

}); };
/**
 * Resolve o problema das propriedades não inicializadas que não poderiam ser
 * observadas.
 * @param {{}} template
 */

var ObservableFix = function (template) {
  if ( template === void 0 ) template = {};

  return ({
  props: {
    data: {
      type: Object,
      default: function () { return Object.assign({}, template); }
    }
  },

  data: function data() {
    return {
      selected: Object.assign({}, template)
    };
  },

  watch: {
    data: function data() {
      this.cloneData();
    }

  },
  methods: {
    cloneData: function cloneData() {
      this.selected = Object.assign({}, template, this.data);
    }

  },

  mounted: function mounted() {
    this.cloneData();
  }

});
};

var mixin = /*#__PURE__*/Object.freeze({
  Loadable: Loadable,
  ObservableFix: ObservableFix
});

/**
 * Integra automaticamente as funções de validação ao vee-validade.
 * @param {vee-validate.Validator} Validator
 * @param {Object.<String, { name: String, getMessage: Function }>} options
 */

var VeeValidateIntegration = function (Validator, options) {
  var defaultOptions = {
    isCPF: {
      name: 'cpf',
      getMessage: function () { return 'CPF inválido.'; }
    },
    isCNPJ: {
      name: 'cnpj',
      getMessage: function () { return 'CNPJ inválido.'; }
    },
    isDate: {
      name: 'date',
      getMessage: function () { return 'Data inválida.'; }
    }
  };
  var rules = Object.assign({}, defaultOptions, options);
  Object.keys(rules).map(function (key) { return Object.assign({}, rules[key], {
    validate: validate[key]
  }); }).filter(function (rule) { return is(rule, 'Object'); }).forEach(function (rule) { return Validator.extend(rule.name, rule); });
  return true;
};

var integrations = {
  'vee-validate': VeeValidateIntegration
};

/**
 * Opções do plugin.
 * @typedef {Object} Options
 * @property {Boolean} formatters
 * @property {Boolean} formatFilters
 * @property {Boolean} validators
 */

/**
 * Adiciona as funções auxiliares definidas no protótipo do Vue, e
 * consequentemente aos componentes.
 * @param {Vue} Vue
 * @param {Options} options
 */

var install = function (Vue, options) {
  if ( options === void 0 ) options = {};

  if (options.formatters) {
    Vue.prototype.$format = format;
  }

  if (options.formatFilters) {
    Object.keys(format).forEach(function (name) {
      var handler = format[name];
      Vue.filter(name, handler);
    });
  }

  if (options.validators) {
    Vue.prototype.$validate = validate;
  }
};
/**
 * Integra-se a lib definida usando o object/função de integração e as opções da
 * integração.
 * @example ```
 * import { Validator } from 'vee-validate'
 * import Util from 'vue-convenia-util'
 *
 * Util.integrate('vee-validate', Validator)
 * ```
 * @param {String} lib
 * @param {(Object|Function)} integrator
 * @param {Object} options
 * @returns {Boolean}
 */


var integrate = function (lib, integrator, options) {
  if ( options === void 0 ) options = {};

  var integration = integrations.hasOwnProperty(lib) ? integrations[lib] : null;
  var success = integration ? integration(integrator, options) : false;
  return success;
};

var index = {
  install: install,
  integrate: integrate,
  validate: validate,
  format: format,
  mixin: mixin
};

export default index;
export { format, validate, mixin };
