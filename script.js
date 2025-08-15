// HTML要素を取得
const base64Input = document.getElementById('base64Input');
const analyzeBtn = document.getElementById('analyzeBtn');
const resultsDiv = document.getElementById('results');
const infoDiv = document.getElementById('info');
const previewContainer = document.getElementById('preview-container');
const previewText = document.getElementById('preview-text');
const previewJapanese = document.getElementById('preview-japanese');
const customPreview = document.getElementById('custom-preview');
const testText = document.getElementById('test-text');
const testBtn = document.getElementById('test-btn');
const unicodeInput = document.getElementById('unicode-input');
const unicodeBtn = document.getElementById('unicode-btn');
const fontStatus = document.getElementById('font-status');
const glyphInfo = document.getElementById('glyph-info');
const puaBtn = document.getElementById('pua-btn');
const puaControls = document.getElementById('pua-controls');
const puaGrid = document.getElementById('pua-grid');
const puaSize = document.getElementById('pua-size');
const puaSizeValue = document.getElementById('pua-size-value');
const puaShowAll = document.getElementById('pua-show-all');
const puaSkipEmpty = document.getElementById('pua-skip-empty');

// ボタンがクリックされたときの処理
analyzeBtn.addEventListener('click', () => {
    const dataUrl = base64Input.value.trim();

    // 入力が空、または正しいData URLでない場合は処理を中断
    if (!dataUrl || !dataUrl.startsWith('data:')) {
        alert('有効なData URLを貼り付けてください。');
        return;
    }

    try {
        // 1. データの解析
        const commaIndex = dataUrl.indexOf(',');
        const metaPart = dataUrl.substring(0, commaIndex); // ヘッダ部分
        const dataPart = dataUrl.substring(commaIndex + 1); // Base64データ本体

        const parts = metaPart.substring(5).split(';');
        const mimeType = parts[0] || 'N/A';
        const encoding = parts.find(p => p.toLowerCase() === 'base64') || 'N/A';
        
        // パラメータを抽出 (例: charset=utf-7)
        const params = parts.slice(1).filter(p => p.toLowerCase() !== 'base64').join(', ');

        // バイナリデータを一部確認
        const binaryData = atob(dataPart);
        const firstBytes = Array.from(binaryData.slice(0, 10), c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');

        // 2. フォントのプレビュー
        const fontName = 'dynamicPreviewFont';

        // 結果を表示
        infoDiv.innerHTML = `
            <ul>
                <li><b>MIMEタイプ:</b> <code>${mimeType}</code></li>
                <li><b>エンコーディング:</b> <code>${encoding}</code></li>
                <li><b>パラメータ:</b> <code>${params || 'なし'}</code></li>
                <li><b>Base64データ長:</b> <code>${dataPart.length}</code> 文字</li>
                <li><b>バイナリデータ長:</b> <code>${binaryData.length}</code> バイト</li>
                <li><b>先頭バイト:</b> <code>${firstBytes.toUpperCase()}</code></li>
                <li><b>フォント名:</b> <code>${fontName}</code></li>
            </ul>
        `;
        resultsDiv.style.display = 'block';

        // 以前のスタイルが残っていれば削除
        const oldStyle = document.getElementById('font-style');
        if (oldStyle) {
            oldStyle.remove();
        }

        // 新しい<style>タグを作成し、@font-faceルールを定義
        const newStyle = document.createElement('style');
        newStyle.id = 'font-style';
        newStyle.textContent = `
            @font-face {
                font-family: '${fontName}';
                src: url('${dataUrl}');
                font-display: swap;
            }
        `;
        // <head>にスタイルを追加
        document.head.appendChild(newStyle);

        // プレビューテキストにフォントを適用
        previewText.style.fontFamily = `'${fontName}', monospace, serif`;
        previewJapanese.style.fontFamily = `'${fontName}', monospace, serif`;
        customPreview.style.fontFamily = `'${fontName}', monospace, serif`;
        customPreview.textContent = testText.value;
        previewContainer.style.display = 'block';

        // カスタムテキストのテストボタンのイベント
        testBtn.onclick = () => {
            customPreview.textContent = testText.value;
        };

        // Unicodeコード変換のイベント
        unicodeBtn.onclick = () => {
            const codes = unicodeInput.value.split(/[,\s]+/).filter(code => code.trim());
            let result = '';
            const codeInfo = [];

            for (const code of codes) {
                const cleanCode = code.trim().toUpperCase();
                if (/^[0-9A-F]+$/.test(cleanCode)) {
                    const codePoint = Number.parseInt(cleanCode, 16);
                    const char = String.fromCodePoint(codePoint);
                    result += char;
                    codeInfo.push(`U+${cleanCode} = "${char}"`);
                } else {
                    codeInfo.push(`"${cleanCode}" は無効なコードです`);
                }
            }

            customPreview.textContent = result;
            
            // コード情報をステータスに表示
            if (codeInfo.length > 0) {
                const existingStatus = fontStatus.textContent;
                const styledCodeInfo = codeInfo.map(info => {
                    if (info.includes('=')) {
                        // U+XXXX = "文字" の形式の場合、文字部分にフォントスタイルを適用
                        const fontFamily = `'${fontName}', monospace, serif`;
                        return info.replace(/"([^"]+)"/g, `"<span style="font-family: ${fontFamily}; font-size: 16px;">$1</span>"`);
                    }
                    return info;
                });
                fontStatus.innerHTML = `${existingStatus}<br><small>${styledCodeInfo.join(', ')}</small>`;
            }
        };

        // 初期状態でUnicodeコードを変換して表示（フォント読み込み前なのでフォントスタイルなし）
        // unicodeBtn.click();

        // Private Use Area 表示機能
        const currentFontName = fontName;
        
        puaBtn.onclick = () => {
            // CSSで設定されたdisplay:noneも考慮した判定
            const isHidden = puaControls.style.display === 'none' || 
                           puaControls.style.display === '' || 
                           getComputedStyle(puaControls).display === 'none';
                           
            if (isHidden) {
                puaControls.style.display = 'block';
                puaBtn.textContent = 'Private Use Area を非表示';
                displayPUA();
            } else {
                puaControls.style.display = 'none';
                puaBtn.textContent = 'Private Use Area の文字を表示';
                puaGrid.innerHTML = '';
            }
        };

        // 範囲選択が変更されたときの処理
        for (const radio of document.querySelectorAll('input[name="pua-range"]')) {
            radio.onchange = () => {
                const isVisible = getComputedStyle(puaControls).display !== 'none';
                if (isVisible) {
                    displayPUA();
                }
            };
        }

        // 「全て表示」チェックボックスの処理
        puaShowAll.onchange = () => {
            const isVisible = getComputedStyle(puaControls).display !== 'none';
            if (isVisible) {
                displayPUA();
            }
        };

        // 「スキップ」チェックボックスの処理
        puaSkipEmpty.onchange = () => {
            const isVisible = getComputedStyle(puaControls).display !== 'none';
            if (isVisible) {
                displayPUA();
            }
        };

        // サイズスライダーの処理
        puaSize.oninput = () => {
            puaSizeValue.textContent = puaSize.value;
            updatePUASize();
        };

        function displayPUA() {
            const selectedRange = document.querySelector('input[name="pua-range"]:checked').value;
            const showAll = puaShowAll.checked;
            let startCode;
            let endCode;
            let maxChars;

            switch (selectedRange) {
                case 'basic':
                    startCode = 0xE000;
                    endCode = 0xF8FF;
                    maxChars = showAll ? (endCode - startCode + 1) : 500; // 6,400文字 または 500文字
                    break;
                case 'plane15':
                    startCode = 0xF0000;
                    endCode = 0xFFFFD;
                    maxChars = showAll ? (endCode - startCode + 1) : 200; // 65,534文字 または 200文字
                    break;
                case 'plane16':
                    startCode = 0x100000;
                    endCode = 0x10FFFD;
                    maxChars = showAll ? (endCode - startCode + 1) : 200; // 65,534文字 または 200文字
                    break;
            }

            const totalChars = endCode - startCode + 1;
            const displayMessage = showAll ? 
                `全${totalChars.toLocaleString()}文字を生成中...（時間がかかる場合があります）` : 
                `最初の${maxChars}文字を生成中...`;

            puaGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 10px;">${displayMessage}</div>`;

            // 非同期で文字を生成
            setTimeout(() => {
                generatePUAGrid(startCode, endCode, maxChars, totalChars, showAll);
            }, 100);
        }

        async function generatePUAGrid(startCode, endCode, maxChars, totalChars, showAll) {
            puaGrid.innerHTML = '';
            let charCount = 0;
            let processedCount = 0;
            let skippedCount = 0;
            const skipEmpty = puaSkipEmpty.checked;

            // Canvas for font detection
            const canvas = document.createElement('canvas');
            canvas.width = 100;
            canvas.height = 50;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            // 文字がフォントに存在するかを判定する関数
            function hasGlyph(char, ctx, fontName) {
                const codeHex = char.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
                
                // 対象文字を描画
                ctx.font = `24px '${fontName}'`;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = 'black';
                ctx.fillText(char, 10, 30);
                const targetImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                
                // 明らかに存在しない文字（Private Use Areaで通常定義されない）を描画
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillText('\uE999', 10, 30); // 存在しないはずのPUA文字
                const notdefImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                
                // 画像データを比較
                let differentPixels = 0;
                let totalNonTransparent = 0;
                
                for (let i = 0; i < targetImageData.data.length; i += 4) {
                    const targetAlpha = targetImageData.data[i + 3];
                    const notdefAlpha = notdefImageData.data[i + 3];
                    
                    if (targetAlpha > 0 || notdefAlpha > 0) {
                        totalNonTransparent++;
                        if (Math.abs(targetAlpha - notdefAlpha) > 10) {
                            differentPixels++;
                        }
                    }
                }
                
                // 文字幅も比較
                const targetWidth = ctx.measureText(char).width;
                const notdefWidth = ctx.measureText('\uE999').width;
                
                // 別の存在しない文字とも比較
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillText('\uE888', 10, 30);
                const notdef2ImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                
                let differentFromNotdef2 = 0;
                for (let i = 0; i < targetImageData.data.length; i += 4) {
                    const targetAlpha = targetImageData.data[i + 3];
                    const notdef2Alpha = notdef2ImageData.data[i + 3];
                    
                    if (Math.abs(targetAlpha - notdef2Alpha) > 10) {
                        differentFromNotdef2++;
                    }
                }
                
                const notdef2Width = ctx.measureText('\uE888').width;
                
                // 判定条件: .notdefと明らかに違う描画がある
                const significantDifference = totalNonTransparent > 0 && 
                    (differentPixels / totalNonTransparent) > 0.1; // 10%以上違う
                
                const widthDifference = Math.abs(targetWidth - notdefWidth) > 2 ||
                    Math.abs(targetWidth - notdef2Width) > 2;
                
                const hasDifference = significantDifference || widthDifference;
                
                // さらに、フォントローディングAPIも使用
                let fontSupported = false;
                try {
                    if (document.fonts && document.fonts.check) {
                        fontSupported = document.fonts.check(`24px '${fontName}'`, char);
                    }
                } catch (e) {
                    // フォールバック
                }
                
                const result = hasDifference && (fontSupported || totalNonTransparent > 20);
                
                if (processedCount < 50) {
                    const diffPercent = totalNonTransparent > 0 ? (differentPixels / totalNonTransparent * 100).toFixed(1) : '0';
                    console.log(`U+${codeHex}: "${char}" diff=${diffPercent}%, width=${targetWidth.toFixed(1)}px (notdef=${notdefWidth.toFixed(1)}px), pixels=${totalNonTransparent}, fontAPI=${fontSupported} -> ${result ? '表示' : 'スキップ'}`);
                }
                
                return result;
            }

            for (let code = startCode; code <= endCode && charCount < maxChars; code++) {
                try {
                    const char = String.fromCodePoint(code);
                    const codeHex = code.toString(16).toUpperCase().padStart(4, '0');
                    
                    // フォントに文字が存在するかチェック
                    let shouldDisplay = true;
                    if (skipEmpty) {
                        // より精密な文字存在判定
                        shouldDisplay = hasGlyph(char, ctx, currentFontName);
                        
                        // デバッグ: 最初の50文字の判定結果をログに出力
                        if (processedCount < 50) {
                            console.log(`U+${codeHex}: "${char}" -> ${shouldDisplay ? '表示' : 'スキップ'}`);
                        }
                        
                        if (!shouldDisplay) {
                            skippedCount++;
                        }
                    }

                    if (shouldDisplay) {
                        const charElement = document.createElement('div');
                        charElement.className = 'pua-char';
                        charElement.style.fontFamily = `'${currentFontName}', monospace, serif`;
                        charElement.style.fontSize = `${puaSize.value}px`;
                        
                        charElement.innerHTML = `
                            <div class="pua-char-display">${char}</div>
                            <div class="pua-char-code">U+${codeHex}</div>
                        `;
                        
                        // クリックでUnicodeコード入力欄にセット
                        charElement.onclick = () => {
                            unicodeInput.value = codeHex;
                            unicodeBtn.click();
                            charElement.style.backgroundColor = '#ffeb3b';
                            setTimeout(() => {
                                charElement.style.backgroundColor = '';
                            }, 1000);
                        };

                        puaGrid.appendChild(charElement);
                        charCount++;
                    }
                    
                    processedCount++;

                    // 100文字ごとに処理を分割してブラウザをブロックしないように
                    // 全表示モードの場合は進捗も表示
                    if (processedCount % 100 === 0) {
                        if (showAll) {
                            const progress = Math.round((processedCount / totalChars) * 100);
                            document.title = `${progress}% 完了 (${charCount}文字表示, ${skippedCount}文字スキップ) - Font Viewer`;
                        }
                        await new Promise(resolve => setTimeout(resolve, 10));
                    }
                } catch (e) {
                    // 無効なコードポイントはスキップ
                }
            }

            // 進捗表示をリセット
            document.title = 'Base64 Font Analyzer';

            // 結果メッセージ
            const resultElement = document.createElement('div');
            resultElement.style.gridColumn = '1/-1';
            resultElement.style.textAlign = 'center';
            resultElement.style.padding = '10px';
            resultElement.style.fontSize = '14px';

            console.log('=== 判定結果統計 ===');
            console.log(`処理した文字数: ${processedCount}`);
            console.log(`表示した文字数: ${charCount}`);
            console.log(`スキップした文字数: ${skippedCount}`);
            console.log(`スキップ率: ${(skippedCount / processedCount * 100).toFixed(1)}%`);

            if (!showAll && processedCount >= maxChars) {
                resultElement.style.color = '#666';
                resultElement.innerHTML = `表示制限により${maxChars}文字まで処理しました<br>` +
                    `${charCount}文字を表示、${skippedCount}文字をスキップ<br>` +
                    `<small>全${totalChars.toLocaleString()}文字を処理するには「全ての文字を表示する」にチェックを入れてください</small>`;
            } else {
                resultElement.style.color = '#090';
                resultElement.innerHTML = `処理完了: ${charCount}文字を表示、${skippedCount}文字をスキップ<br>` +
                    `<small>全${processedCount.toLocaleString()}文字を処理しました</small>`;
            }

            puaGrid.appendChild(resultElement);
        }

        function updatePUASize() {
            const charElements = puaGrid.querySelectorAll('.pua-char');
            for (const element of charElements) {
                element.style.fontSize = `${puaSize.value}px`;
            }
        }

        // フォント読み込み状況を確認
        if (document.fonts) {
            fontStatus.textContent = 'フォント読み込み中...';
            const fontFace = new FontFace(fontName, `url('${dataUrl}')`);
            fontFace.load().then(() => {
                console.log('フォント読み込み成功');
                fontStatus.textContent = 'フォント読み込み成功 ✓';
                fontStatus.style.color = '#090';
                
                // フォントが実際に適用されているか確認
                document.fonts.add(fontFace);
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                ctx.font = `20px ${fontName}`;
                const metrics = ctx.measureText('E283');
                fontStatus.textContent += ` (文字幅: ${Math.round(metrics.width)}px)`;

                // 特定の文字がサポートされているかテスト
                testCharacterSupport(ctx, fontName);

                // フォント読み込み完了後にUnicode変換を実行
                unicodeBtn.click();
            }).catch((err) => {
                console.error('フォント読み込み失敗:', err);
                fontStatus.textContent = 'フォント読み込み失敗 ✗';
                fontStatus.style.color = '#f00';
                glyphInfo.innerHTML = '<strong>文字サポート情報:</strong> フォント読み込みに失敗しました';
            });
        } else {
            fontStatus.textContent = 'Font Loading APIをサポートしていません';
            fontStatus.style.color = '#fa0';
            glyphInfo.innerHTML = '<strong>文字サポート情報:</strong> Font Loading APIをサポートしていません';
        }

        // 文字サポートをテストする関数
        function testCharacterSupport(ctx, currentFontName) {
            const testChars = [
                { code: 0xE283, name: 'E283' },
                { code: 0x0041, name: 'A' },
                { code: 0x0042, name: 'B' },
                { code: 0x0043, name: 'C' },
                { code: 0x0030, name: '0' },
                { code: 0x0031, name: '1' },
                { code: 0x3042, name: 'あ' },
                { code: 0x3044, name: 'い' }
            ];

            const supported = [];
            const fallbackFont = 'Arial';
            
            for (const testChar of testChars) {
                const char = String.fromCodePoint(testChar.code);
                
                // 対象フォントでの文字幅を測定
                ctx.font = `20px '${currentFontName}', monospace, serif`;
                const targetWidth = ctx.measureText(char).width;
                
                // フォールバックフォントでの文字幅を測定
                ctx.font = `20px ${fallbackFont}`;
                const fallbackWidth = ctx.measureText(char).width;
                
                // 幅が違えば対象フォントに文字が含まれている可能性が高い
                const isSupported = Math.abs(targetWidth - fallbackWidth) > 0.1;
                
                if (isSupported || testChar.code <= 0x007F) { // ASCII文字は表示
                    supported.push(`<span style="font-family: '${currentFontName}', monospace, serif; font-size: 16px;">${char}</span> U+${testChar.code.toString(16).toUpperCase().padStart(4, '0')} (${testChar.name})`);
                }
            }

            if (supported.length > 0) {
                glyphInfo.innerHTML = `<strong>サポートされている文字 (一部):</strong><br>${supported.slice(0, 6).join('<br>')}${supported.length > 6 ? '<br>...' : ''}`;
            } else {
                glyphInfo.innerHTML = '<strong>文字サポート情報:</strong> 基本的な文字のサポートを確認できませんでした';
            }
        }

    } catch (error) {
        alert('データの解析中にエラーが発生しました。入力内容を確認してください。');
        console.error(error);
        resultsDiv.style.display = 'none';
        previewContainer.style.display = 'none';
    }
});