import { render } from '@testing-library/react';
import App from '../src/App';

test('Renders front page without error', () => {
  render(
    <App />
  );
});