RemoteCloudPC
=============

実行方法 (in local PC)
----------------------

1. Node.js が無ければインストール
2. TypeScript コンパイラと TSD (TypeScript Definition manager) をインストール

    ```
    $ npm install typescript tsd -g
    ```

3. プロジェクトディレクトリで以下を実行してビルド

    ```
    $ npm install
    $ tsd install
    $ tsc
    ```

4. HTTP サーバー、WebSocket サーバーを起動 (それぞれ別のターミナルで)

    ```
    $ node http.js
    $ node websocket.js
    ```

5. ホスト (のモック) を起動してホスト ID を得る

    ```
    $ node host_mock.js
    Host ID: 9429414
    Press return key to exit.
    ```

6. ブラウザで localhost:1337 に接続し、ホスト ID を入力して接続
7. 枠内でクリックするとホストにログが出る
