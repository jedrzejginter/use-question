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

export default function useQuestion<AskCallbackConfig = void, ConfirmCallbackData = void>() {
  type ValueReturnedFromAsk = void extends ConfirmCallbackData ? true : ConfirmCallbackData;

  const [config, setConfig] = React.useState<AskCallbackConfig | null>(null);
  const callbacksRef = React.useRef<Callbacks<ConfirmCallbackData>>(noopCallbacks);
  const previousCallPromiseRef = React.useRef(noopPromise);

  const ask = React.useCallback(
    async (config: AskCallbackConfig): Promise<ValueReturnedFromAsk|false> => {
      callbacksRef.current.onDismiss();

      await previousCallPromiseRef.current;

      let promises: [Promise<'CANCEL'>, Promise<'CONFIRM' | ConfirmCallbackData>];
      let rejections: [() => void, () => void] = [noop, noop];

      let resolvePreviousCall: () => void;

      previousCallPromiseRef.current = new Promise<void>((resolve) => {
        resolvePreviousCall = resolve;
      });

      promises = [
        new Promise<'CANCEL'>((resolve, reject) => {
          rejections[0] = reject;
          callbacksRef.current.onDismiss = () => resolve('CANCEL');
        }).then((val) => {
          setConfig(null);
          rejections[1]();
          callbacksRef.current = noopCallbacks;
          resolvePreviousCall();

          return val;
        }),
        new Promise<'CONFIRM' | ConfirmCallbackData>((resolve, reject) => {
          rejections[1] = reject;
          callbacksRef.current.onConfirm = (data: ConfirmCallbackData) => resolve(data ?? 'CONFIRM');
        }).then((val) => {
          setConfig(null);
          rejections[0]();
          callbacksRef.current = noopCallbacks;
          resolvePreviousCall();

          return val;
        }),
      ];

      setConfig(config);

      const resolvedValue = await Promise.race<
        Promise<'CANCEL' | 'CONFIRM' | ConfirmCallbackData>
      >(promises);

      // Dismissed or cancelled.
      if (resolvedValue === 'CANCEL') {
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
