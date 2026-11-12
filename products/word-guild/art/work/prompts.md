# 画像生成指示

各案は「共通」に対応する案の指示を続けて、組み込み画像生成機能に渡した。

## 共通

Use case: illustration-story. A portrait key visual for a game's title screen and opening, 1080×1920 equivalent, vertical 9:16. A foggy harbor town on a slope with a small post office, rookie delivery girl Tsumugi wearing a postal cap and carrying a mailbag, and her tiny owl companion Furo, born from sealing wax, with a vermilion wax seal mark on its chest. Reserve the entire upper third as quiet open sky and fog for a title to be added later. Paper and letterpress ink print illustration, bold ink outlines, flat colors (3–4 colors per object), visible paper grain. Main palette: ink navy #1f2a44, paper #f3ead8, sealing wax vermilion #c8462f, fog #9fb3bf, lamplight #f2b84b. Original character designs. No text, letters, logos, sign lettering, watermark, pixel art, anime shading, photorealism, or extensive gradients.

## A

View from the bottom of a steep harbor town slope looking uphill toward the little post office. Tsumugi and Furo are in the foreground setting out toward it; rooftops and harbor glimpses frame the hill. Hopeful misty morning.

## B

Morning outside the little post office: Tsumugi receives her mailbag at the doorway, with Furo perched nearby. The sloping harbor town recedes behind them. Intimate, welcoming, calm composition.

## C

Evening in dense harbor fog: a single streetlamp glows beside the slope and the small post office. Tsumugi and Furo stand together under its warm light. Quiet, mysterious and reassuring.

## A2（描き直し）

以下の同一指示を、key-a.png を編集対象として組み込み画像生成機能に2回渡した。

Use case: illustration-story. Edit the supplied key visual into a portrait 9:16 game illustration. Preserve its composition and distinctive paper-and-letterpress print style: view uphill from the bottom of stone steps toward the little post office in a foggy harbor town at morning; Tsumugi and the tiny white owl Furo in foreground; streetlamp at left, distant harbor and lighthouse; upper third entirely open sky and fog. Bold ink outlines, flat colors, paper grain; navy #1f2a44, paper #f3ead8, vermilion #c8462f, fog #9fb3bf, lamplight #f2b84b. Tsumugi wears a vermilion cap and coat, white scarf, black braid with vermilion ribbon, navy skirt, shoulder mailbag. Furo has a vermilion wax seal on its chest. Redraw Tsumugi from behind, head clearly oriented up toward the post office. Anatomically coherent shoulders, elbows, wrists and hands; both coat sleeves match; only one hand grips the bag strap, with five correctly formed digits. The bag flap is closed with no letters visible. Show both complete boots firmly planted on two successive horizontal stair treads, one foot one step higher, climbing; leave room around the feet. Continuous structurally coherent fence posts and chains; streetlamp pole naturally overlaps buildings. Owl has exactly two matching wings, one on each side. No text, lettering, signs, symbols or marks resembling writing anywhere, including the mailbox slot; no logos or watermark.

## A3（躍動感）

生成方法：組み込み画像生成ツール。両案とも `key-a2-2.png` を編集対象として指定。

### A3-1

Edit the attached key visual as an illustration-story game key art, vertical 9:16. Preserve its printed paper and letterpress woodcut style, heavy navy outlines, flat inks, paper texture and palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, light #f2b84b. Preserve the foggy morning harbor town, distant harbor and lighthouse, streetlamp, stone stairs and small post office with red mailbox at the top. Keep the upper third open sky and mist for a title. Tsumugi is seen diagonally from behind, face nearly hidden, looking up at the post office, red cap and coat, white scarf, black braid with red ribbon, navy skirt, boots, closed shoulder mailbag with no letters protruding. Redraw her leaning forward in a large uphill stride, rear boot pushing off and leading boot naturally on the higher step. Her scarf, braid and ribbon stream in the wind. Fuuro is a small white owl with red wax seal on chest, flying slightly ahead and above her, vigorously leading toward the post office, back or profile facing uphill, never facing the viewer, both wings anatomically natural. Emphasize strong diagonal composition from lower left through Tsumugi and owl to upper right post office, stairs and correctly joined railing posts and chains aligned with perspective. Fog streams backwards. Natural limbs and hands; hide left hand behind body. No symbolic motion lines, no letters, numbers, symbols, text or markings anywhere including mailbox slot.

### A3-2

Edit the attached key visual as an illustration-story game key art, vertical 9:16. Preserve its printed paper and letterpress woodcut style, heavy navy outlines, flat inks, paper texture and palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, light #f2b84b. Preserve the foggy morning harbor town, distant harbor and lighthouse, streetlamp, stone stairs and small post office with red mailbox at the top. Keep the upper third open sky and mist for a title. Tsumugi is seen diagonally from behind, face nearly hidden, looking up at the post office, red cap and coat, white scarf, black braid with red ribbon, navy skirt, boots, closed shoulder mailbag with no letters protruding. Redraw her leaning forward in a large uphill stride, rear boot pushing off and leading boot naturally on the higher step. Her scarf, braid and ribbon stream in the wind. Fuuro is a small white owl with red wax seal on chest, flying slightly ahead and above her, vigorously leading toward the post office, back or profile facing uphill, never facing the viewer, both wings anatomically natural. Use a distinctly low camera looking uphill from near the steps, with strong foreshortening and depth, while keeping the full figure and office legible; stairs and properly connected railing guide the eye uphill. Fog streams backwards. Natural limbs and hands; hide left hand behind body. No symbolic motion lines, no letters, numbers, symbols, text or markings anywhere including mailbox slot.

## A4（フクロウの後ろ姿）

画像生成ツールで `key-a3-2.png` を編集対象として指定。共通の指示文：

> Use case: precise-object-edit. Edit the supplied image, a portrait 9:16 game key visual. Preserve the original image and composition as closely as possible: steep stone steps viewed from below, post office upper right, streetlamp left, harbor and lighthouse, upper third misty sky; Tsumugi's exact rear-facing pose, clothing, flowing scarf and braid, closed bag; paper and letterpress print texture, bold outlines, flat colors and navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, light #f2b84b. Replace only the bird with Fuurou, clearly a round, plump white owl seen completely from behind, flying toward the post office door in the upper right, slightly ahead and above Tsumugi. Its entire head, body and short tail point away from the viewer toward that door; show only back, back of round head and short tail feathers. Absolutely no face, beak, eyes, chest or chest seal visible. Broad rounded wings spread symmetrically from its back, [wing angle]; a few navy feather marks and small vermilion feather ornament atop head. Owl silhouette must not resemble a pigeon or gull. Ensure hands and fingers, foot contact with steps, fence posts and chains connect naturally. No text or symbols.

- A4-1 の `[wing angle]`: `angled upward in a strong flap`
- A4-2 の `[wing angle]`: `held nearly horizontal in a strong flap`

## A5（左足の修正）

組み込み画像生成ツールで `key-a4-1.png` を編集対象として、それぞれ次の指示を使用。

### A5-1
Use case: precise-object-edit. Edit the provided image as the exact target, portrait 9:16. Change ONLY Tsumugi's trailing left leg and boot at lower left: immediately after pushing off the stair, anatomically natural knee and ankle, toe pointing uphill toward upper right and post office, with only a little of the lifted heel side of the sole visible. Keep her leading right foot on its step. Preserve every other pixel as closely as possible: composition, rest of pose, clothes, scarf, braids, closed bag, owl facing away, streetlight, railings, steps, post office, harbor, lighthouse, foggy sky, colors, textures and illustration style. No other changes.

### A5-2
Use case: precise-object-edit. Edit the provided image as the exact target, portrait 9:16. Correct ONLY Tsumugi's rear left leg and boot at lower left, with a subtly more bent knee and raised heel just after pushing off: the boot toe points uphill to upper right toward the post office, only a small portion of the heel side of its sole visible, natural anatomy. Keep her leading right foot on its step. Preserve every other pixel as closely as possible: composition, rest of pose, clothes, scarf, braids, closed bag, owl facing away, streetlight, railings, steps, post office, harbor, lighthouse, foggy sky, colors, textures and illustration style. No other changes.

## A6（後ろ足の描き直し）

元画像 `key-a4-1.png` を編集対象とし、縦9:16。画面左下のツムギの後ろ足だけを変更し、前足、閉じた鞄、マフラー、三つ編み、フウロウ、石段、背景、構図、質感、色はできるだけ維持する。カメラは低い位置からの斜め後ろで、右上へ上る腰・膝・足首・つま先を自然にそろえる。ふくらはぎや足首をねじらず、靴底を大きく正面に見せない。

1. 歩いて上る：後ろ足のほぼ足裏全体を下の段に乗せ、かかとが浮き始め、つま先を右上へ。膝を軽く曲げ、両足を接地。かかとを後ろから見せる。
2. 踏み出す直前：後ろ足のつま先だけを段の縁に乗せて右上に向け、かかとを上げる。かかとと靴底の後ろ半分だけを斜めに見せ、膝を自然に曲げる。
3. 足元を隠す：後ろ足をスカートと閉じた鞄、または手前の柵と段の縁に自然に隠し、膝から下をほぼ見せない。上の段の前足は明瞭に残す。

生成：組み込み imagegen により元画像から各案を個別に編集。

## 本番：shimi.png

参照画像：key-a4-1.png（画風）

Use case: illustration-story. Square 1:1 game enemy cutout, one centered large subject with small margin on all sides. Use the provided key visual as the style reference: paper and letterpress ink print, bold navy outlines, flat 3–4 colors per object, paper grain on the subject. Palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, light #f2b84b. A slightly cute but scary living stain that erases words in the misty port town. Background must be a perfectly uniform solid pure green #00ff00, no texture, shadows, ground, fog, objects or gradients anywhere in background. No green on subject. No text, logos, signs, symbols, numbers, existing characters, pixel art, anime rendering, realism, or excessive gradients. Anatomically coherent limbs and consistent orientation. Subject: A small navy ink stain creature, wobbly gelatinous silhouette, white eyes.

## 本番：keshikasu.png

参照画像：key-a4-1.png（画風）

Use case: illustration-story. Square 1:1 game enemy cutout, one centered large subject with small margin on all sides. Use the provided key visual as the style reference: paper and letterpress ink print, bold navy outlines, flat 3–4 colors per object, paper grain on the subject. Palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, light #f2b84b. A slightly cute but scary living stain that erases words in the misty port town. Background must be a perfectly uniform solid pure green #00ff00, no texture, shadows, ground, fog, objects or gradients anywhere in background. No green on subject. No text, logos, signs, symbols, numbers, existing characters, pixel art, anime rendering, realism, or excessive gradients. Anatomically coherent limbs and consistent orientation. Subject: A rolling cluster of gray eraser crumbs, a cohesive cute scary creature.

## 本番：nijimi.png

参照画像：key-a4-1.png（画風）

Use case: illustration-story. Square 1:1 game enemy cutout, one centered large subject with small margin on all sides. Use the provided key visual as the style reference: paper and letterpress ink print, bold navy outlines, flat 3–4 colors per object, paper grain on the subject. Palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, light #f2b84b. A slightly cute but scary living stain that erases words in the misty port town. Background must be a perfectly uniform solid pure green #00ff00, no texture, shadows, ground, fog, objects or gradients anywhere in background. No green on subject. No text, logos, signs, symbols, numbers, existing characters, pixel art, anime rendering, realism, or excessive gradients. Anatomically coherent limbs and consistent orientation. Subject: A ghostlike creature made of water-bleeding ink, indistinct outline represented by discrete flat printed color bands, not gradients.

## 本番：hokoridama.png

参照画像：key-a4-1.png（画風）

Use case: illustration-story. Square 1:1 game enemy cutout, one centered large subject with small margin on all sides. Use the provided key visual as the style reference: paper and letterpress ink print, bold navy outlines, flat 3–4 colors per object, paper grain on the subject. Palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, light #f2b84b. A slightly cute but scary living stain that erases words in the misty port town. Background must be a perfectly uniform solid pure green #00ff00, no texture, shadows, ground, fog, objects or gradients anywhere in background. No green on subject. No text, logos, signs, symbols, numbers, existing characters, pixel art, anime rendering, realism, or excessive gradients. Anatomically coherent limbs and consistent orientation. Subject: A ball of mist-colored cotton dust with thin arms and legs.

## 本番：atenashi.png

参照画像：key-a4-1.png（画風）

Use case: illustration-story. Square 1:1 game enemy cutout, one centered large subject with small margin on all sides. Use the provided key visual as the style reference: paper and letterpress ink print, bold navy outlines, flat 3–4 colors per object, paper grain on the subject. Palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, light #f2b84b. A slightly cute but scary living stain that erases words in the misty port town. Background must be a perfectly uniform solid pure green #00ff00, no texture, shadows, ground, fog, objects or gradients anywhere in background. No green on subject. No text, logos, signs, symbols, numbers, existing characters, pixel art, anime rendering, realism, or excessive gradients. Anatomically coherent limbs and consistent orientation. Subject: A sad one-eyed envelope whose address has disappeared, with thin arms and legs, blank envelope with no marks.

## 本番：oshimi.png

参照画像：key-a4-1.png（画風）

Use case: illustration-story. Square 1:1 game enemy cutout, one centered large subject with small margin on all sides. Use the provided key visual as the style reference: paper and letterpress ink print, bold navy outlines, flat 3–4 colors per object, paper grain on the subject. Palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, light #f2b84b. A slightly cute but scary living stain that erases words in the misty port town. Background must be a perfectly uniform solid pure green #00ff00, no texture, shadows, ground, fog, objects or gradients anywhere in background. No green on subject. No text, logos, signs, symbols, numbers, existing characters, pixel art, anime rendering, realism, or excessive gradients. Anatomically coherent limbs and consistent orientation. Subject: A powerful enormous navy ink blot monster, crown-like splashes on top and many small eyes.

## 本番：tsumugi-normal.png
Square game asset. Reference image is definitive style: paper and letterpress ink print, thick navy outlines, flat 3–4 colors per object and paper grain. Palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, light #f2b84b. No text, logo, symbols or numbers. Correct anatomy. Full body centered large with margin. Background perfectly flat solid pure chroma green #00ff00 everywhere outside character, no shadows, ground, texture or gradient; no green in character. Tsumugi, the young postal delivery girl from reference, facing forward standing cheerfully: vermilion cap and coat, white scarf, black braid with vermilion ribbon, navy skirt, boots, closed postal satchel. Reference: key-a4-1.png.

## 本番：tsumugi-joy.png
Edit the provided character image into a matching square game sprite. Keep the same Tsumugi face, black braid, red cap and coat, white scarf, navy skirt, boots, closed postal bag, proportions, colors, printmaking style and flat solid pure #00ff00 background. Change her pose to joyfully raise one hand, with anatomically correct fingers. Full body with margin. No text, symbols, shadows or background texture. Reference: tsumugi-normal.png.

## 本番：fuurou-normal.png
Square game asset. Reference image is definitive style: paper and letterpress ink print, thick navy outlines, flat 3–4 colors per object and paper grain. Palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, light #f2b84b. No text, logo, symbols or numbers. Correct anatomy. Full body centered large with margin. Background perfectly flat solid pure chroma green #00ff00 everywhere outside character, no shadows, ground, texture or gradient; no green in character. Fuurou, small white owl born from sealing wax, facing forward perching: round plump body, large round head, rounded wings, small vermilion feather ornament on top of head, vermilion wax seal on chest. Reference: key-a4-1.png.

## 本番：fuurou-stamp.png
Edit this square game character image: the exact same Fuurou owl, keeping face, plumage, ornament, chest wax seal, colors, proportions and paper letterpress print style. Show the owl pressing a vermilion stamp with one rounded wing; stamp face has no writing or symbols. Full body centered with margin, anatomically correct wings. Background completely flat solid pure green #00ff00, no ground, shadow or pattern, no text. Reference: fuurou-normal.png.

## 本番：hatori-normal.png
Square game asset. Reference image is definitive style: paper and letterpress ink print, thick navy outlines, flat 3–4 colors per object and paper grain. Palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, light #f2b84b. No text, logo, symbols or numbers. Correct anatomy. Full body centered large with margin. Background perfectly flat solid pure chroma green #00ff00 everywhere outside character, no shadows, ground, texture or gradient; no green in character. Hatori, elderly woman postmaster, facing forward calmly: white hair gathered up, round glasses, navy uniform and apron. Reference: key-a4-1.png.

## 本番：hatori-smile.png
Edit this square game character image: same Hatori postmaster, keep her face, white hair, round glasses, navy uniform, apron, hat, bag, proportions, colors and paper letterpress print style exactly. Change expression only: eyes gently narrowed and smiling warmly. Full body centered with margin. Background perfectly flat pure green #00ff00, no shadows, ground or texture. No text, logos, symbols or numbers. Reference: hatori-normal.png.

## 本番：icon.png
Square game asset. Reference image is definitive style: paper and letterpress ink print, thick navy outlines, flat 3–4 colors per object and paper grain. Palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, light #f2b84b. No text, logo, symbols or numbers. Correct anatomy. App icon: close-up face of Fuurou, small white owl with rounded head and small vermilion feather ornament, with an envelope behind. Flat solid paper #f3ead8 background, no green. Thick outlines, large simple shapes readable at small sizes. Reference: key-a4-1.png.

## 本番：open-2.png

Use the attached key-a4-1.png as the definitive visual style reference. Game background illustration of Yosuga harbor town: paper and letterpress ink print, bold navy outlines, flat colors only 3–4 colors per object, visible paper grain. Palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, lamplight #f2b84b. No text, letters, logo, signs with writing, symbols or numerals. No pixel art, anime shading, realism, or excessive gradients. No recognizable existing characters. Anatomically correct hands, limbs and wings, consistent orientation. Portrait 9:16 opening illustration. A blank white letter lies open on a desk; its disappearing ink has become wisps of mist being drawn out through a window. The paper is completely blank, no letterforms anywhere. Keep the upper third open and uncluttered.

## 本番：open-3.png

Use the attached key-a4-1.png as the definitive visual style reference. Game background illustration of Yosuga harbor town: paper and letterpress ink print, bold navy outlines, flat colors only 3–4 colors per object, visible paper grain. Palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, lamplight #f2b84b. No text, letters, logo, signs with writing, symbols or numerals. No pixel art, anime shading, realism, or excessive gradients. No recognizable existing characters. Anatomically correct hands, limbs and wings, consistent orientation. Portrait 9:16 opening illustration. Across a post office counter, Hatori, an elderly woman postmaster with white hair gathered up and round glasses, extends a postal satchel with a red wax seal. Tsumugi receiving it is visible only as hands and sleeves. Correct natural hands. Keep the upper third open and uncluttered.

## 本番：post-office.png

Use the attached key-a4-1.png as the definitive visual style reference. Game background illustration of Yosuga harbor town: paper and letterpress ink print, bold navy outlines, flat colors only 3–4 colors per object, visible paper grain. Palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, lamplight #f2b84b. No text, letters, logo, signs with writing, symbols or numerals. No pixel art, anime shading, realism, or excessive gradients. No recognizable existing characters. Anatomically correct hands, limbs and wings, consistent orientation. Landscape 3:2 warm post office interior background: wooden sorting shelves, bundles of blank letters, counter, glowing lamp, misty harbor through window. No people.

## 本番：ward-1.png

Use the attached key-a4-1.png as the definitive visual style reference. Game background illustration of Yosuga harbor town: paper and letterpress ink print, bold navy outlines, flat colors only 3–4 colors per object, visible paper grain. Palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, lamplight #f2b84b. No text, letters, logo, signs with writing, symbols or numerals. No pixel art, anime shading, realism, or excessive gradients. No recognizable existing characters. Anatomically correct hands, limbs and wings, consistent orientation. Landscape 3:2 game battle background: morning market on a hill, cloth awnings and baskets of vegetables. Keep the bottom 40 percent simple unobstructed ground or cobblestones for enemies. No people.

## 本番：ward-2.png

Use the attached key-a4-1.png as the definitive visual style reference. Game background illustration of Yosuga harbor town: paper and letterpress ink print, bold navy outlines, flat colors only 3–4 colors per object, visible paper grain. Palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, lamplight #f2b84b. No text, letters, logo, signs with writing, symbols or numerals. No pixel art, anime shading, realism, or excessive gradients. No recognizable existing characters. Anatomically correct hands, limbs and wings, consistent orientation. Landscape 3:2 game battle background: cobblestone shopping street at midday, shop eaves and hanging blank signboards. Keep the bottom 40 percent simple unobstructed cobblestones for enemies. No people.

## 本番：ward-3.png

Use the attached key-a4-1.png as the definitive visual style reference. Game background illustration of Yosuga harbor town: paper and letterpress ink print, bold navy outlines, flat colors only 3–4 colors per object, visible paper grain. Palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, lamplight #f2b84b. No text, letters, logo, signs with writing, symbols or numerals. No pixel art, anime shading, realism, or excessive gradients. No recognizable existing characters. Anatomically correct hands, limbs and wings, consistent orientation. Landscape 3:2 game battle background: harbor warehouse district under overcast skies, wooden crates, crane and moored ship. Keep the bottom 40 percent simple unobstructed ground for enemies. No people.

## 本番：ward-4.png

Use the attached key-a4-1.png as the definitive visual style reference. Game background illustration of Yosuga harbor town: paper and letterpress ink print, bold navy outlines, flat colors only 3–4 colors per object, visible paper grain. Palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, lamplight #f2b84b. No text, letters, logo, signs with writing, symbols or numerals. No pixel art, anime shading, realism, or excessive gradients. No recognizable existing characters. Anatomically correct hands, limbs and wings, consistent orientation. Landscape 3:2 game battle background: town hall clock tower at dusk overlooking a plaza, clock face entirely blank with no numbers or marks. Keep the bottom 40 percent simple unobstructed paving for enemies. No people.

## 本番：ward-5.png

Use the attached key-a4-1.png as the definitive visual style reference. Game background illustration of Yosuga harbor town: paper and letterpress ink print, bold navy outlines, flat colors only 3–4 colors per object, visible paper grain. Palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, lamplight #f2b84b. No text, letters, logo, signs with writing, symbols or numerals. No pixel art, anime shading, realism, or excessive gradients. No recognizable existing characters. Anatomically correct hands, limbs and wings, consistent orientation. Landscape 3:2 game battle background: station-front hotel street at night, station building, illuminated hotel windows, a row of street lamps. Keep the bottom 40 percent simple unobstructed paving for enemies. No people.

## 本番：ward-6.png

Use the attached key-a4-1.png as the definitive visual style reference. Game background illustration of Yosuga harbor town: paper and letterpress ink print, bold navy outlines, flat colors only 3–4 colors per object, visible paper grain. Palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, lamplight #f2b84b. No text, letters, logo, signs with writing, symbols or numerals. No pixel art, anime shading, realism, or excessive gradients. No recognizable existing characters. Anatomically correct hands, limbs and wings, consistent orientation. Landscape 3:2 game battle background: lighthouse cape on the night before a storm, lighthouse beam, rocky coastline and waves. Keep the bottom 40 percent simple unobstructed ground for enemies. No people.
