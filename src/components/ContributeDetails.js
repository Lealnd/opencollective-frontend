import PropTypes from 'prop-types';
import { compose, withHandlers, withState } from 'recompose';
import { format, addYears, addMonths } from 'date-fns/esm';
import { pick } from 'lodash';

import Container from './Container';
import { Flex } from '@rebass/grid';
import StyledButtonSet from './StyledButtonSet';
import StyledInputField from './StyledInputField';
import StyledInput from './StyledInput';
import StyledSelect from './StyledSelect';
import { P, Span } from './Text';
import Currency from './Currency';

const frequencyOptions = {
  year: 'Yearly',
  month: 'Monthly',
};

const addFrequency = {
  year: addYears,
  month: addMonths,
};

const enhance = compose(
  withState('state', 'setState', ({ amountOptions, showFrequency }) => ({
    amount: amountOptions[0] / 100,
    totalAmount: amountOptions[0],
    interval: showFrequency ? Object.keys(frequencyOptions)[0] : undefined,
  })),
  withHandlers({
    onChange: ({ state, setState, onChange }) => newState => {
      newState = { ...state, ...newState };
      setState(newState);
      onChange(pick(newState, ['totalAmount', 'interval']));
    },
  }),
);

const ContributeDetails = enhance(({ amountOptions, currency, showFrequency, onChange, state }) => (
  <Container as="fieldset" border="none">
    <Flex>
      <StyledInputField label={`Amount (${currency})`} htmlFor="totalAmount">
        {fieldProps => (
          <StyledButtonSet
            {...fieldProps}
            combo
            items={amountOptions}
            selected={state.totalAmount}
            onChange={totalAmount => onChange({ totalAmount, amount: totalAmount / 100 })}
          >
            {({ item }) => <Currency value={item} currency={currency} />}
          </StyledButtonSet>
        )}
      </StyledInputField>
      <Container maxWidth={100}>
        <StyledInputField label="Other" htmlFor="totalAmount">
          {fieldProps => (
            <StyledInput
              type="text"
              {...fieldProps}
              value={state.amount}
              fontSize="Paragraph"
              lineHeight="Paragraph"
              width={1}
              borderRadius="0 4px 4px 0"
              ml="-1px"
              onChange={({ target }) => onChange({ amount: target.value, totalAmount: Number(target.value) * 100 })}
            />
          )}
        </StyledInputField>
      </Container>
    </Flex>
    {showFrequency && (
      <Flex mt={3} alignItems="flex-end" width={0.5}>
        <StyledInputField label="Frequency" htmlFor="interval">
          {fieldProps => (
            <StyledSelect
              {...fieldProps}
              options={frequencyOptions}
              defaultValue={frequencyOptions[state.interval]}
              onChange={({ key }) => onChange({ interval: key })}
            >
              {({ value }) => <Container minWidth={100}>{value}</Container>}
            </StyledSelect>
          )}
        </StyledInputField>
        <P color="black.500" ml={3} pb={2}>
          Next contribution:{' '}
          <Span color="primary.500">
            {format(addFrequency[state.interval](new Date(), 1), 'MMM d, YYYY', { awareOfUnicodeTokens: true })}
          </Span>
        </P>
      </Flex>
    )}
  </Container>
));

ContributeDetails.propTypes = {
  amountOptions: PropTypes.arrayOf(PropTypes.number).isRequired,
  currency: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  showFrequency: PropTypes.bool,
};

ContributeDetails.defaultProps = {
  onChange: () => {},
  showFrequency: false,
};

export default ContributeDetails;
