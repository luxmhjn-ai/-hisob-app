import React, {useState} from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';

const {width} = Dimensions.get('window');
const BUTTON_SIZE = (width - 5 * 12) / 4;

// ── Colour palette ──────────────────────────────────────────────
const COLORS = {
  background: '#1C1C1E',
  display:    '#1C1C1E',
  funcBtn:    '#3A3A3C',
  numBtn:     '#2C2C2E',
  opBtn:      '#FF9F0A',
  funcText:   '#FFFFFF',
  numText:    '#FFFFFF',
  opText:     '#FFFFFF',
  displayText:'#FFFFFF',
  subText:    '#8E8E93',
};

// ── Button layout definition ─────────────────────────────────────
const BUTTONS = [
  [{label: 'C',   type: 'func', wide: false},
   {label: '+/-', type: 'func', wide: false},
   {label: '%',   type: 'func', wide: false},
   {label: '÷',   type: 'op',   wide: false}],

  [{label: '7',   type: 'num',  wide: false},
   {label: '8',   type: 'num',  wide: false},
   {label: '9',   type: 'num',  wide: false},
   {label: '×',   type: 'op',   wide: false}],

  [{label: '4',   type: 'num',  wide: false},
   {label: '5',   type: 'num',  wide: false},
   {label: '6',   type: 'num',  wide: false},
   {label: '−',   type: 'op',   wide: false}],

  [{label: '1',   type: 'num',  wide: false},
   {label: '2',   type: 'num',  wide: false},
   {label: '3',   type: 'num',  wide: false},
   {label: '+',   type: 'op',   wide: false}],

  [{label: '0',   type: 'num',  wide: true},
   {label: '.',   type: 'num',  wide: false},
   {label: '=',   type: 'op',   wide: false}],
];

// ── Calculator logic ─────────────────────────────────────────────
function calculate(a, op, b) {
  const fa = parseFloat(a);
  const fb = parseFloat(b);
  switch (op) {
    case '+': return fa + fb;
    case '−': return fa - fb;
    case '×': return fa * fb;
    case '÷': return fb !== 0 ? fa / fb : 'Error';
    default:  return fb;
  }
}

function formatNumber(num) {
  if (num === 'Error') return 'Error';
  const str = String(num);
  // Keep trailing dot for UX
  if (str.endsWith('.')) return str;
  const parsed = parseFloat(str);
  if (isNaN(parsed)) return '0';
  // Avoid scientific notation for reasonable numbers
  if (Math.abs(parsed) < 1e15 && str.length <= 15) {
    // Format integer part with commas, keep decimals as-is
    const [intPart, decPart] = str.split('.');
    const formatted = parseInt(intPart, 10).toLocaleString('en-US');
    return decPart !== undefined ? `${formatted}.${decPart}` : formatted;
  }
  return parsed.toExponential(6);
}

// ── Main component ───────────────────────────────────────────────
function App() {
  const [display, setDisplay]         = useState('0');
  const [storedValue, setStoredValue] = useState(null);
  const [operator, setOperator]       = useState(null);
  const [waitingForNext, setWaiting]  = useState(false);
  const [expression, setExpression]   = useState('');

  function handleNumber(label) {
    if (display === 'Error') {
      setDisplay(label === '.' ? '0.' : label);
      setExpression('');
      return;
    }

    if (waitingForNext) {
      setDisplay(label === '.' ? '0.' : label);
      setWaiting(false);
      return;
    }

    if (label === '.') {
      if (display.includes('.')) return;
      setDisplay(display + '.');
      return;
    }

    setDisplay(display === '0' ? label : display + label);
  }

  function handleOperator(op) {
    if (op === '=') {
      if (operator && !waitingForNext) {
        const result = calculate(storedValue, operator, display);
        const res    = String(result);
        setExpression(`${formatNumber(storedValue)} ${operator} ${formatNumber(display)} =`);
        setDisplay(res);
        setStoredValue(res);
        setOperator(null);
        setWaiting(true);
      }
      return;
    }

    // Chaining operators
    if (operator && !waitingForNext) {
      const result = calculate(storedValue, operator, display);
      const res    = String(result);
      setDisplay(res);
      setStoredValue(res);
      setExpression(`${formatNumber(res)} ${op}`);
    } else {
      setStoredValue(display);
      setExpression(`${formatNumber(display)} ${op}`);
    }

    setOperator(op);
    setWaiting(true);
  }

  function handleFunc(label) {
    if (label === 'C') {
      setDisplay('0');
      setStoredValue(null);
      setOperator(null);
      setWaiting(false);
      setExpression('');
      return;
    }

    if (display === 'Error') return;

    if (label === '+/-') {
      const val = parseFloat(display) * -1;
      setDisplay(String(val));
      return;
    }

    if (label === '%') {
      const val = parseFloat(display) / 100;
      setDisplay(String(val));
      return;
    }
  }

  function onPress(btn) {
    if (btn.type === 'num')  handleNumber(btn.label);
    if (btn.type === 'op')   handleOperator(btn.label);
    if (btn.type === 'func') handleFunc(btn.label);
  }

  // Dynamic display font size
  const dispText  = formatNumber(display);
  const fontSize  = dispText.length > 9 ? 48 : dispText.length > 6 ? 60 : 76;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* ── Display area ── */}
      <View style={styles.displayContainer}>
        <Text style={styles.expression} numberOfLines={1}>{expression}</Text>
        <Text style={[styles.displayText, {fontSize}]} numberOfLines={1} adjustsFontSizeToFit>
          {dispText}
        </Text>
      </View>

      {/* ── Buttons area ── */}
      <View style={styles.buttonsContainer}>
        {BUTTONS.map((row, rIdx) => (
          <View key={rIdx} style={styles.row}>
            {row.map((btn, bIdx) => {
              const bgColor =
                btn.type === 'func' ? COLORS.funcBtn :
                btn.type === 'op'   ? COLORS.opBtn   : COLORS.numBtn;
              const textColor =
                btn.type === 'func' ? COLORS.funcText :
                btn.type === 'op'   ? COLORS.opText   : COLORS.numText;
              const isActiveOp = operator === btn.label && waitingForNext;

              return (
                <TouchableOpacity
                  key={bIdx}
                  style={[
                    styles.button,
                    btn.wide && styles.wideButton,
                    {backgroundColor: isActiveOp ? '#FFFFFF' : bgColor},
                  ]}
                  onPress={() => onPress(btn)}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.buttonText,
                      {color: isActiveOp ? COLORS.opBtn : textColor},
                    ]}>
                    {btn.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  displayContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  expression: {
    color: COLORS.subText,
    fontSize: 22,
    marginBottom: 4,
    minHeight: 28,
  },
  displayText: {
    color: COLORS.displayText,
    fontWeight: '200',
    letterSpacing: -2,
  },
  buttonsContainer: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  wideButton: {
    width: BUTTON_SIZE * 2 + 12,
    borderRadius: BUTTON_SIZE / 2,
    paddingLeft: BUTTON_SIZE * 0.35,
    alignItems: 'flex-start',
  },
  buttonText: {
    fontSize: 32,
    fontWeight: '400',
  },
});

export default App;
