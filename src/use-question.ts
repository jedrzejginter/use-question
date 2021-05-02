import React, { useRef } from 'react';

function fn() {}

const initCallbacks = {
  okCallback: fn,
  cancelCallback: fn,
};

function isActive<D>(c: { data: D | null }): c is { data: D } {
  return c.data !== null;
}

const prom = Promise.resolve();

export default function useQuestion<DataType = string>() {
  const [data, setData] = React.useState<DataType | null>(null);
  const callbacksRef = React.useRef({
    okCallback: fn,
    cancelCallback: fn,
  });
  const prevRef = useRef(prom);

  const ask = React.useCallback(async (data: DataType) => {
    callbacksRef.current.cancelCallback();


    await prevRef.current;


    let promises: [Promise<any>, Promise<any>];
    let rejects: any[] = [];

    let prevRes: () => void;

    const p0 = new Promise<void>((res) => {
      prevRes = res;
    });

    prevRef.current = p0;

    promises = [
      new Promise((res, rej) => {
        rejects[0] = rej;
        callbacksRef.current.cancelCallback = () => res('CANCEL');
      }).then((val) => {
        setData(null);
        rejects[1]();
        callbacksRef.current = initCallbacks;
        prevRes();
        return val;
      }),
      new Promise((res, rej) => {
        rejects[1] = rej;
        callbacksRef.current.okCallback = () => res('CONFIRM');
      }).then((val) => {
        setData(null);
        rejects[0]();
        callbacksRef.current = initCallbacks;
        prevRes();
        return val;
      }),
    ];

    setData(data);

    const decision = await Promise.race(promises);

    return decision !== 'CANCEL';
  }, []);

  const onConfirm = React.useCallback(() => {
    callbacksRef.current.okCallback();
  }, []);

  const onReject = React.useCallback(() => {
    callbacksRef.current.cancelCallback();
  }, []);

  return { ask, data, isActive, onConfirm, onReject };
}
