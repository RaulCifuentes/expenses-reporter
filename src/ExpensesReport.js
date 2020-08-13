import React, { useEffect, useRef, useState } from 'react';
import './ExpensesReport.css';

export default function ExpensesReport() {

  const [allCurrencies, setAllCurrencies] = useState([]);

  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [limitExceeded, setLimitExceeded] = useState(false);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [currency, setCurrency] = useState('CAD');

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(
          'https://api.exchangeratesapi.io/latest?base=CAD',
      );
      const json = await response.json();
      const allCurrenciesAsObject = json['rates'];
      const allCurrenciesKeys = Object.keys(allCurrenciesAsObject);
      const allCurrenciesAsArray = allCurrenciesKeys.map((currKey) => {
        return {
          key: currKey,
          value: Number.parseFloat(allCurrenciesAsObject[currKey])
        }
      });
      setAllCurrencies(allCurrenciesAsArray);
    }
    fetchData();
  }, []);


  const handleDeleteExpense = index => {
    const newExpenses = [...expenses];
    newExpenses.splice(index, 1);
    setExpenses(newExpenses);
  };


  const sendReport = (evt) => {
    console.log(`%c========= HELLO ==========`,  "color: yellow");
    console.log("%cReport sent:\n%s", "color: yellow", JSON.stringify(expenses, null, 2));
    console.dir(expenses);
    console.log(`%c========== BYE ===========`,  "color: yellow");
    evt.preventDefault();
  }

  return (
      <div className="reportHost">
        <ExpenseForm description={description} setDescription={setDescription} amount={amount} setAmount={setAmount}
                     currency={currency} setCurrency={setCurrency} allCurrencies={allCurrencies} expenses={expenses}
                     setExpenses={setExpenses} total={total} setTotal={setTotal} setLimitExceeded={setLimitExceeded}
        />
        <ExpensesTableView expenses={expenses} total={total} onDeleteExpense={handleDeleteExpense}/>
        {
          limitExceeded ?
              <section className="errorMessage">
                Hmm, sorry but the maximum for the entire report is $CAD 1000
              </section>
              :
              <button name="sendReport" onClick={sendReport}>Submit</button>
        }
      </div>

  );
}


function ExpenseForm({ description, setDescription, amount, setAmount, currency, setCurrency, allCurrencies, expenses, setExpenses, total, setTotal, setLimitExceeded}) {

  const LIMIT_AMOUNT = 1000;

  const amountInputRef = useRef(null);

  const clearForm = (form) => {
    setDescription('');
    setAmount(0);
    setCurrency('CAD');
  }

  const handleAddExpense = (evt) => {
    const amountNumber = roundTwoDecimal(Number.parseFloat(amount));
    const newExpense = ({ description, amount: amountNumber, currency });
    // enrich the expense with normalized amount
    newExpense.normalizedAmount = getCADEquivalent(amount, currency);
    //check limit of 1000 CAD
    const newTotal = total + newExpense.normalizedAmount;
    if (newTotal > LIMIT_AMOUNT) {
      setLimitExceeded(true);
      amountInputRef.current && amountInputRef.current.select()
    } else {
      setExpenses([...expenses, newExpense]);
      setTotal(newTotal);
      setLimitExceeded(false);
      clearForm();
    }
    evt.preventDefault();
  }

  const getCADEquivalent = (amount, currency) => {
    const exchangeRate = allCurrencies.find((el) => el.key === currency).value;
    const normalized = (amount / exchangeRate);
    return roundTwoDecimal(normalized);
  }

  return (

      <form className="expenseForm">
        <fieldset className="expenseForm-fieldset" disabled={expenses.length >= 5}>

          <label>
            Description <input type="text" size="40" value={description}
                               onChange={e => setDescription(e.target.value)}/>
          </label>

          <label>
            Currency <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ width: "8em" }}>
            {
              allCurrencies.map((curr) => <option key={curr.value} value={curr.key}>{curr.key}</option>)
            }
          </select>
          </label>

          <label>
            Amount <input type="number" min="0" size="10" value={amount} ref={amountInputRef}
                          style={{ textAlign: "right" }} onChange={e => setAmount(e.target.value)}/>
          </label>

          <button type="submit" name="addExpense" onClick={handleAddExpense}>Add expense</button>

        </fieldset>
      </form>

  );
}

function ExpenseRowView({ expense }) {
  return (
      <React.Fragment>
        <td>
          {expense.description}
        </td>
        <td style={{ textAlign: "right" }}>
          {CurrencyFormatted(expense.amount)}
        </td>
        <td style={{ textAlign: "center" }}>
          {expense.currency}
        </td>
        <td style={{ textAlign: "right" }}>
          {CurrencyFormatted(expense.normalizedAmount)}
        </td>
      </React.Fragment>
  );
}

function ExpensesTableView({ expenses, total, onDeleteExpense }) {
  return (
      <table className="expensesTable">
        <thead>
        <tr>
          <th colSpan="4">Expenses Report</th>
          <th rowSpan="2">Action</th>
        </tr>
        <tr>
          <th style={{ textAlign: "center" }}>Description</th>
          <th style={{ textAlign: "center" }}>Amount</th>
          <th style={{ textAlign: "center" }}>Currency</th>
          <th style={{ textAlign: "center" }}>Amount ($ CAD)</th>
        </tr>
        </thead>
        <tbody>
        {
          expenses.map((expense, index) =>
              (
                  <tr key={index}>
                    <ExpenseRowView expense={expense}/>
                    <td style={{ height: "2em", textAlign: "center" }}>
                      <button onClick={() => onDeleteExpense(index)}> {`Delete`} </button>
                    </td>
                  </tr>
              ))
        }
        </tbody>
        <tfoot>
        <tr>
          <th colSpan="3">Total ($ CAD)</th>
          <td style={{ textAlign: "right", fontWeight: "bold" }}>{CurrencyFormatted(total)}</td>
        </tr>
        </tfoot>
      </table>)
}


/**
 * Helper functions
 */
function roundTwoDecimal(number) {
  return Math.round((number + Number.EPSILON) * 100) / 100
}

function CurrencyFormatted(amount) {
  let i = parseFloat(amount);
  if (isNaN(i)) {
    i = 0.00;
  }
  let minus = '';
  if (i < 0) {
    minus = '-';
  }
  i = Math.abs(i);
  i = parseInt((i + .005) * 100);
  i = i / 100;
  let s = String(i);
  if (s.indexOf('.') < 0) {
    s += '.00';
  }
  if (s.indexOf('.') === (s.length - 2)) {
    s += '0';
  }
  s = minus + s;
  return s;
}
