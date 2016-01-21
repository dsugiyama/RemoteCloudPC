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
    $ node js/http.js
    $ node js/websocket.js
    ```

5. ホスト (のモック) を起動してホスト ID を得る

    ```
    $ node js/host_mock.js
    Host ID: 9429414
    Press return key to exit.
    ```

6. ブラウザで localhost:1337 に接続し、ホスト ID を入力して接続
7. 枠内でクリックするとホストにログが出る



画面転送方法
----

1. ffmpegの最新バイナリをダウンロード
2. 先述のWebSocket サーバーの実行後，ffmpegを用いて画面キャプチャを転送

    ```
    ffmpeg -f gdigrab -draw_mouse 1 -show_region 1 -framerate 30 -video_size 800x600 -i desktop -f mpeg1video -b 800k http://localhost:8082/<hostid>/
    ```
※ 要パラメータ調整