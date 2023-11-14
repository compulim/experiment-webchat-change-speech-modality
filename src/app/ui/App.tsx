import './App.css';

import { memo, useEffect, useMemo, useState } from 'react';
import ReactWebChat, { createDirectLine, createBrowserWebSpeechPonyfillFactory } from 'botframework-webchat';

export default memo(function App() {
  const [directLine, setDirectLine] = useState<ReturnType<typeof createDirectLine> | undefined>();
  const [supportSpeech, setSupportSpeech] = useState(false);

  const browserWebSpeechPonyfillFactory = useMemo(() => createBrowserWebSpeechPonyfillFactory(), []);

  useEffect(() => {
    const interval = setInterval(() => setSupportSpeech(supportSpeech => !supportSpeech), 2_000);

    return () => clearInterval(interval);
  }, [setSupportSpeech]);

  useEffect(() => {
    const abortController = new AbortController();

    (async function () {
      const res = await fetch(`https://webchat-mockbot3.azurewebsites.net/api/token/directline`, {
        method: 'POST',
        signal: abortController.signal
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status} while fetching a Direct Line token.`);
      }

      const { token } = await res.json();

      if (abortController.signal.aborted) {
        return;
      }

      setDirectLine(createDirectLine({ token }));
    })();

    return () => abortController.abort();
  }, [setDirectLine]);

  useEffect(() => {
    if (!directLine) {
      return () => {};
    }

    let counter = 0;

    const interval = setInterval(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      directLine.postActivity({ text: `Number ${++counter}.`, type: 'message' } as any).subscribe(() => {});
    }, 3_000);

    return () => clearInterval(interval);
  }, [directLine]);

  useEffect(() => {
    if (!directLine) {
      return () => {};
    }

    const timeout = setTimeout(() => {
      console.log(document.querySelector('.webchat__send-box-text-box__input'));
      (document.querySelector('.webchat__send-box-text-box__input') as HTMLInputElement | undefined)?.focus();
    }, 500);

    return () => clearTimeout(timeout);
  }, [directLine]);

  return (
    <div className="app">
      <h1>Hello, World!</h1>
      <div role="presentation">
        <p>In this experiment, we are:</p>
        <ul>
          <li>flipping between text and speech mode, once every 2 seconds;</li>
          <li>send a message to the bot, once every 3 seconds.</li>
        </ul>
        <p>We want to know if live region will be interrupted when input modality is being switched.</p>
      </div>
      {directLine && (
        <ReactWebChat
          className="app__web-chat"
          directLine={directLine}
          {...(supportSpeech
            ? {
                webSpeechPonyfillFactory: browserWebSpeechPonyfillFactory
              }
            : {})}
        />
      )}
    </div>
  );
});
