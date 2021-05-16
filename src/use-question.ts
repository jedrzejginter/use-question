import React from 'react';

function noop() {}

const noopPromise = Promise.resolve();

const noopCallbacks = {
  onConfirm: noop,
  onDismiss: noop,
};

function isActive<AskCallbackConfig>(
  question: { config: AskCallbackConfig | null },
): question is { config: AskCallbackConfig } {
  return question.config !== null;
}

type Callbacks<ConfirmCallbackData> = {
  onConfirm: (data: ConfirmCallbackData) => void;
  onDismiss: () => void;
};

export default function useQuestion<AskCallbackConfig = void, ConfirmCallbackData = void>(
  hookOptions: {timeout?:number} = {}
) {
  type ValueReturnedFromAsk = void extends ConfirmCallbackData ? true : ConfirmCallbackData;

  const [config, setConfig] = React.useState<AskCallbackConfig | null>(null);
  const callbacksRef = React.useRef<Callbacks<ConfirmCallbackData>>(noopCallbacks);
  const previousCallPromiseRef = React.useRef(noopPromise);
  const hookOptionsRef = React.useRef(hookOptions)

  const ask = React.useCallback(
    async (config: AskCallbackConfig): Promise<ValueReturnedFromAsk|false> => {
      callbacksRef.current.onDismiss();

      await previousCallPromiseRef.current;

      let promises: [Promise<'TIMEOUT'>, Promise<'CANCEL'>, Promise<'CONFIRM' | ConfirmCallbackData>];
      let rejections: [() => void, () => void, () => void] = [noop, noop, noop];

      let resolvePreviousCall: () => void;

      previousCallPromiseRef.current = new Promise<void>((resolve) => {
        resolvePreviousCall = resolve;
      });

      function rejectAllExcept(exceptIndex: number) {
        rejections.forEach((reject, index) => {
          if (index === exceptIndex) {
            return
          }

          reject()
        })
      }

      promises = [
        new Promise<'TIMEOUT'>((resolve, reject) => {
          rejections[0] = reject;

          if (!hookOptionsRef.current.timeout) {
            return
          }

          setTimeout(() => { resolve('TIMEOUT') }, hookOptionsRef.current.timeout);
        }).then((val) => {
          setConfig(null);
          rejectAllExcept(0);
          callbacksRef.current = noopCallbacks;
          resolvePreviousCall();

          return val;
        }),
        new Promise<'CANCEL'>((resolve, reject) => {
          rejections[1] = reject;
          callbacksRef.current.onDismiss = () => resolve('CANCEL');
        }).then((val) => {
          setConfig(null);
          rejectAllExcept(1);
          callbacksRef.current = noopCallbacks;
          resolvePreviousCall();

          return val;
        }),
        new Promise<'CONFIRM' | ConfirmCallbackData>((resolve, reject) => {
          rejections[2] = reject;
          callbacksRef.current.onConfirm = (data: ConfirmCallbackData) => resolve(data ?? 'CONFIRM');
        }).then((val) => {
          setConfig(null);
          rejectAllExcept(2);
          callbacksRef.current = noopCallbacks;
          resolvePreviousCall();

          return val;
        }),
      ];

      setConfig(config);

      const resolvedValue = await Promise.race<
        Promise<'TIMEOUT' | 'CANCEL' | 'CONFIRM' | ConfirmCallbackData>
      >(promises);

      // Dismissed, timed out or cancelled.
      if (resolvedValue === 'CANCEL' || resolvedValue === 'TIMEOUT') {
        return false;
      }

      // Confirmed without any value (or with null/undefined).
      if (resolvedValue === 'CONFIRM') {
        return true as ValueReturnedFromAsk
      }

      // We have to warn user about passing a falsy value that would
      // cause 'ask(..)' to be falsy when calling 'confirm(..)'..
      if (
        typeof resolvedValue === 'number' && resolvedValue === 0 ||
        typeof resolvedValue === 'string' && resolvedValue === ''
      ) {
        console.error(
          'You have passed a falsy value to the "confirm" callback causing possible incorrect behavior of this hook. Returning true instead.'
        );

        return true as ValueReturnedFromAsk
      }

      return resolvedValue as ValueReturnedFromAsk;
    },
    [],
  );

  const confirm = React.useCallback((data: ConfirmCallbackData) => {
    callbacksRef.current.onConfirm(data);
  }, []);

  const dismiss = React.useCallback(() => {
    callbacksRef.current.onDismiss();
  }, []);

  return React.useMemo(() => ({ ask, confirm, dismiss, config, isActive }), [
    ask, confirm, dismiss, config
  ]);
}
