import React from 'react'
import useQuestion from './src'

function Component() {
  const {ask,...question} = useQuestion<{ message: string },'xyz'>();

  const handleClick = React.useCallback(async () => {
    const r = await ask({ message: 'Are you sure you want to do this?' })

    if (r) {
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
          <button onClick={() => question.onConfirm('xyz')}>CONFIRM</button>
        </div>
      )}
    </>

  )
}
