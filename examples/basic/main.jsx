import React from 'react'

import useQuestion from '../../src'

export function Component() {
  const { ask, ...question } = useQuestion({ timeout: 3000 });

  const handleClick = React.useCallback(async () => {
    const res = await ask({ message: 'Are you sure you want to do this?' })

    if (res) {
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
          {question.config.message}
          <hr />
          <button onClick={() => question.dismiss()}>DISMISS</button>
          <button onClick={() => question.confirm('xyz')}>CONFIRM</button>
        </div>
      )}
    </>
  );
}
