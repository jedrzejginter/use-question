# @ginterdev/use-question

> React hook for user action confirmation based on promises.

## Installation

```bash
yarn add --dev @ginterdev/use-question

# or

npm i -D @ginterdev/use-question
```

## Usage

```tsx
import * as React from 'react';
import useQuestion from '@ginterdev/use-question';

function Component() {
  const { ask,...question } = useQuestion<{ message: string }>();

  const handleClick = React.useCallback(async () => {
    if (await ask({ message: 'Are you sure you want to do this?' })) {
      console.log('CONFIRMED ✅');
    } else {
      console.log('CANCELLED ❌');
    }
  }, [ask]);

  return (
    <>
      <button onClick={() => handleClick()}>Ask question</button>
      {question.isActive(question) && (
        <div>
          {question.data.message}
          <hr />
          <button onClick={() => question.onReject()}>CANCEL</button>
          <button onClick={() => question.onConfirm()}>CONFIRM</button>
        </div>
      )}
    </>
  );
}
```
