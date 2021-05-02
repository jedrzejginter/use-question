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

type Callbacks<DT> = {
  okCallback: (d: DT) => void;
  cancelCallback: () => void;
}

export default function useQuestion<DataType = void, CbData = void>() {
  const [data, setData] = React.useState<DataType | null>(null);
  const callbacksRef = React.useRef<Callbacks<CbData>>({
    okCallback: fn,
    cancelCallback: fn,
  });
  const prevRef = useRef(prom);

  const ask = React.useCallback(async (data: DataType): Promise<(void extends CbData ? true : CbData)|false> => {
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
      new Promise<'CANCEL'>((res, rej) => {
        rejects[0] = rej;
        callbacksRef.current.cancelCallback = () => res('CANCEL');
      }).then((val) => {
        setData(null);
        rejects[1]();
        callbacksRef.current = initCallbacks;
        prevRes();
        return val;
      }),
      new Promise<CbData|void|'CONFIRM'>((res, rej) => {
        rejects[1] = rej;
        callbacksRef.current.okCallback = (d: CbData) => res(d ?? 'CONFIRM');
      }).then((val) => {
        setData(null);
        rejects[0]();
        callbacksRef.current = initCallbacks;
        prevRes();
        return val;
      }),
    ];

    setData(data);

    const val = await Promise.race<Promise<any>>(promises);

    if (val === 'CANCEL') {
      return false;
    }

    return (typeof val === 'undefined' || val === 'CONFIRM') ? true : val;
  }, []);

  const onConfirm = React.useCallback((d: CbData) => {
    callbacksRef.current.okCallback(d);
  }, []);

  const onReject = React.useCallback(() => {
    callbacksRef.current.cancelCallback();
  }, []);

  return { ask, data, isActive, onConfirm, onReject };
}
