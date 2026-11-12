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

## 紙魚の体：body-money.png

Use the five attached monster illustrations as style references. Create one square full-body game character concept: an ink monster whose body is stacked coins melting together, with white coin eyes. Clearly a living creature, not an object. Thick navy outlines, flat distinct regions of navy #1f2a44, mist #9fb3bf, paper #f3ead8, a tiny amount of vermilion #c8462f; letterpress ink on textured paper, charmingly eerie. Centered large with margins. Background absolutely flat pure green #00ff00 everywhere, no shadow, ground, texture or pattern. No green in creature. No letters, numbers, symbols, logos, gradients or coin markings.

## 紙魚の体：body-work.png

Use the image as a style reference for line weight, paper texture, white eyes and palette, not as the subject. Create a distinct square full-body monster: a squat ink-soaked briefcase creature with an open mouth and its handle forming horns. It must read as a living ink monster. Thick navy outlines; flat distinct navy #1f2a44, mist #9fb3bf, paper #f3ead8 and a tiny vermilion #c8462f; printed ink on textured paper. Centered with margins. Background absolutely flat pure green #00ff00, no ground or shadows. No green on body, no text, numbers, logos or gradients.

## 紙魚の体：body-person.png

Use the image as a style reference for line weight, paper texture, white eyes and palette, not as the subject. Create a distinct square full-body monster: a very tall thin ink humanoid with a silk top hat and extremely long arms. It must read as a living ink monster. Thick navy outlines; flat distinct navy #1f2a44, mist #9fb3bf, paper #f3ead8 and a tiny vermilion #c8462f; printed ink on textured paper. Centered with margins. Background absolutely flat pure green #00ff00, no ground or shadows. No green on body, no text, numbers, logos or gradients.

## 紙魚の体：body-time.png

Use the image as a style reference for line weight, paper texture, white eyes and palette, not as the subject. Create a distinct square full-body monster: a dripping pocket-watch ink creature with clock hands as limbs and no numerals. It must read as a living ink monster. Thick navy outlines; flat distinct navy #1f2a44, mist #9fb3bf, paper #f3ead8 and a tiny vermilion #c8462f; printed ink on textured paper. Centered with margins. Background absolutely flat pure green #00ff00, no ground or shadows. No green on body, no text, numbers, logos or gradients.

## 紙魚の体：body-place.png

Use the image as a style reference for line weight, paper texture, white eyes and palette, not as the subject. Create a distinct square full-body monster: a crooked little house tower ink creature with window eyes and a flag. It must read as a living ink monster. Thick navy outlines; flat distinct navy #1f2a44, mist #9fb3bf, paper #f3ead8 and a tiny vermilion #c8462f; printed ink on textured paper. Centered with margins. Background absolutely flat pure green #00ff00, no ground or shadows. No green on body, no text, numbers, logos or gradients.

## 紙魚の体：body-move.png

Use the image as a style reference for line weight, paper texture, white eyes and palette, not as the subject. Create a distinct square full-body monster: a traveling ink creature with wheels and wings holding a blank ticket in its mouth. It must read as a living ink monster. Thick navy outlines; flat distinct navy #1f2a44, mist #9fb3bf, paper #f3ead8 and a tiny vermilion #c8462f; printed ink on textured paper. Centered with margins. Background absolutely flat pure green #00ff00, no ground or shadows. No green on body, no text, numbers, logos or gradients.

## 紙魚の体：body-food.png

Use the image as a style reference for line weight, paper texture, white eyes and palette, not as the subject. Create a distinct square full-body monster: an ink droplet creature overflowing from a soup bowl, with spoon hands. It must read as a living ink monster. Thick navy outlines; flat distinct navy #1f2a44, mist #9fb3bf, paper #f3ead8 and a tiny vermilion #c8462f; printed ink on textured paper. Centered with margins. Background absolutely flat pure green #00ff00, no ground or shadows. No green on body, no text, numbers, logos or gradients.

## 紙魚の体：body-doc.png

Use the image as a style reference for line weight, paper texture, white eyes and palette, not as the subject. Create a distinct square full-body monster: a curled parchment scroll ink creature with a quill tail, not an envelope. It must read as a living ink monster. Thick navy outlines; flat distinct navy #1f2a44, mist #9fb3bf, paper #f3ead8 and a tiny vermilion #c8462f; printed ink on textured paper. Centered with margins. Background absolutely flat pure green #00ff00, no ground or shadows. No green on body, no text, numbers, logos or gradients.

## 紙魚の体：body-goods.png

Use the image as a style reference for line weight, paper texture, white eyes and palette, not as the subject. Create a distinct square full-body monster: an ink paper shopping bag creature with a blank price tag. It must read as a living ink monster. Thick navy outlines; flat distinct navy #1f2a44, mist #9fb3bf, paper #f3ead8 and a tiny vermilion #c8462f; printed ink on textured paper. Centered with margins. Background absolutely flat pure green #00ff00, no ground or shadows. No green on body, no text, numbers, logos or gradients.

## 紙魚の体：body-tool.png

Use the image as a style reference for line weight, paper texture, white eyes and palette, not as the subject. Create a distinct square full-body monster: an ink creature of interlocking gears with screw feet. It must read as a living ink monster. Thick navy outlines; flat distinct navy #1f2a44, mist #9fb3bf, paper #f3ead8 and a tiny vermilion #c8462f; printed ink on textured paper. Centered with margins. Background absolutely flat pure green #00ff00, no ground or shadows. No green on body, no text, numbers, logos or gradients.

## 紙魚の体：body-nature.png

Use the image as a style reference for line weight, paper texture, white eyes and palette, not as the subject. Create a distinct square full-body monster: an ink cloud creature mixed with leaves and raindrops. It must read as a living ink monster. Thick navy outlines; flat distinct navy #1f2a44, mist #9fb3bf, paper #f3ead8 and a tiny vermilion #c8462f; printed ink on textured paper. Centered with margins. Background absolutely flat pure green #00ff00, no ground or shadows. No green on body, no text, numbers, logos or gradients.

## 紙魚の体：body-body.png

Use the image as a style reference for line weight, paper texture, white eyes and palette, not as the subject. Create a distinct square full-body monster: an ink creature shaped like a large palm with a bandage. It must read as a living ink monster. Thick navy outlines; flat distinct navy #1f2a44, mist #9fb3bf, paper #f3ead8 and a tiny vermilion #c8462f; printed ink on textured paper. Centered with margins. Background absolutely flat pure green #00ff00, no ground or shadows. No green on body, no text, numbers, logos or gradients.

## 紙魚の体：body-mind.png

Use the image as a style reference for line weight, paper texture, white eyes and palette, not as the subject. Create a distinct square full-body monster: a floating ink creature shaped like a speech bubble, empty of text. It must read as a living ink monster. Thick navy outlines; flat distinct navy #1f2a44, mist #9fb3bf, paper #f3ead8 and a tiny vermilion #c8462f; printed ink on textured paper. Centered with margins. Background absolutely flat pure green #00ff00, no ground or shadows. No green on body, no text, numbers, logos or gradients.

## 紙魚の体：body-number.png

Use the image as a style reference for line weight, paper texture, white eyes and palette, not as the subject. Create a distinct square full-body monster: an ink creature made of a ruler and building blocks, ticks but no numbers. It must read as a living ink monster. Thick navy outlines; flat distinct navy #1f2a44, mist #9fb3bf, paper #f3ead8 and a tiny vermilion #c8462f; printed ink on textured paper. Centered with margins. Background absolutely flat pure green #00ff00, no ground or shadows. No green on body, no text, numbers, logos or gradients.

## 紙魚の体：body-action.png

Use the image as a style reference for line weight, paper texture, white eyes and palette, not as the subject. Create a distinct square full-body monster: a swirling whirlwind ink creature with an arrow-shaped tail. It must read as a living ink monster. Thick navy outlines; flat distinct navy #1f2a44, mist #9fb3bf, paper #f3ead8 and a tiny vermilion #c8462f; printed ink on textured paper. Centered with margins. Background absolutely flat pure green #00ff00, no ground or shadows. No green on body, no text, numbers, logos or gradients.

## 紙魚の体：body-state.png

Use the image as a style reference for line weight, paper texture, white eyes and palette, not as the subject. Create a distinct square full-body monster: an ink star-shaped creature with spiky stars growing from its body. It must read as a living ink monster. Thick navy outlines; flat distinct navy #1f2a44, mist #9fb3bf, paper #f3ead8 and a tiny vermilion #c8462f; printed ink on textured paper. Centered with margins. Background absolutely flat pure green #00ff00, no ground or shadows. No green on body, no text, numbers, logos or gradients.


## 家：1

Square 1:1 game map asset. One single building centered large, viewed slightly from an angle, only a small patch of cobblestones under its feet. Match key-a4-1.png as style reference: Japanese paper and letterpress ink print illustration, thick navy outlines, flat fills, paper texture on building, palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, warm gold #f2b84b. ALL windows dark and unlit. Background absolutely flat solid pure chroma green #00ff00 edge to edge, no sky, haze, texture or shadow in background; no green anywhere on building. No people, letters, numbers, symbols or writing. Blank signs. Building: post office with Tsumugi’s upstairs little room, red tiled gable roof, exterior stairs and red postbox


## 家：2

Square 1:1 game map asset. One single building centered large, viewed slightly from an angle, only a small patch of cobblestones under its feet. Match key-a4-1.png as style reference: Japanese paper and letterpress ink print illustration, thick navy outlines, flat fills, paper texture on building, palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, warm gold #f2b84b. ALL windows dark and unlit. Background absolutely flat solid pure chroma green #00ff00 edge to edge, no sky, haze, texture or shadow in background; no green anywhere on building. No people, letters, numbers, symbols or writing. Blank signs. Building: hill morning market entrance gate, one roofed gatehouse structure with striped awning and produce baskets


## 家：3

Square 1:1 game map asset. One single building centered large, viewed slightly from an angle, only a small patch of cobblestones under its feet. Match key-a4-1.png as style reference: Japanese paper and letterpress ink print illustration, thick navy outlines, flat fills, paper texture on building, palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, warm gold #f2b84b. ALL windows dark and unlit. Background absolutely flat solid pure chroma green #00ff00 edge to edge, no sky, haze, texture or shadow in background; no green anywhere on building. No people, letters, numbers, symbols or writing. Blank signs. Building: Riku’s hilltop home, compact timber cottage with asymmetrical steep roof and fishing basket


## 家：4

Square 1:1 game map asset. One single building centered large, viewed slightly from an angle, only a small patch of cobblestones under its feet. Match key-a4-1.png as style reference: Japanese paper and letterpress ink print illustration, thick navy outlines, flat fills, paper texture on building, palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, warm gold #f2b84b. ALL windows dark and unlit. Background absolutely flat solid pure chroma green #00ff00 edge to edge, no sky, haze, texture or shadow in background; no green anywhere on building. No people, letters, numbers, symbols or writing. Blank signs. Building: grandmother’s tiny house across the bay, low hipped roof, round attic window and potted plants


## 家：5

Square 1:1 game map asset. One single building centered large, viewed slightly from an angle, only a small patch of cobblestones under its feet. Match key-a4-1.png as style reference: Japanese paper and letterpress ink print illustration, thick navy outlines, flat fills, paper texture on building, palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, warm gold #f2b84b. ALL windows dark and unlit. Background absolutely flat solid pure chroma green #00ff00 edge to edge, no sky, haze, texture or shadow in background; no green anywhere on building. No people, letters, numbers, symbols or writing. Blank signs. Building: post office for Tsumugi, narrow corner tower building with a projecting upper room and mail slot


## 家：6

Square 1:1 game map asset. One single building centered large, viewed slightly from an angle, only a small patch of cobblestones under its feet. Match key-a4-1.png as style reference: Japanese paper and letterpress ink print illustration, thick navy outlines, flat fills, paper texture on building, palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, warm gold #f2b84b. ALL windows dark and unlit. Background absolutely flat solid pure chroma green #00ff00 edge to edge, no sky, haze, texture or shadow in background; no green anywhere on building. No people, letters, numbers, symbols or writing. Blank signs. Building: Tsumugi’s diary kept in her upstairs post office room, cozy post office building with dormer roof and small balcony


## 家：7

Square 1:1 game map asset. One single building centered large, viewed slightly from an angle, only a small patch of cobblestones under its feet. Match key-a4-1.png as style reference: Japanese paper and letterpress ink print illustration, thick navy outlines, flat fills, paper texture on building, palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, warm gold #f2b84b. ALL windows dark and unlit. Background absolutely flat solid pure chroma green #00ff00 edge to edge, no sky, haze, texture or shadow in background; no green anywhere on building. No people, letters, numbers, symbols or writing. Blank signs. Building: Stone Street shops and staff, a single stone street merchant guild building with wide arcade and blank oval hanging sign


## 家：8

Square 1:1 game map asset. One single building centered large, viewed slightly from an angle, only a small patch of cobblestones under its feet. Match key-a4-1.png as style reference: Japanese paper and letterpress ink print illustration, thick navy outlines, flat fills, paper texture on building, palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, warm gold #f2b84b. ALL windows dark and unlit. Background absolutely flat solid pure chroma green #00ff00 edge to edge, no sky, haze, texture or shadow in background; no green anywhere on building. No people, letters, numbers, symbols or writing. Blank signs. Building: Stone Street tailor, narrow two-story shop with mansard roof, fabric rolls and blank shield-shaped sign


## 家：9

Square 1:1 game map asset. One single building centered large, viewed slightly from an angle, only a small patch of cobblestones under its feet. Match key-a4-1.png as style reference: Japanese paper and letterpress ink print illustration, thick navy outlines, flat fills, paper texture on building, palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, warm gold #f2b84b. ALL windows dark and unlit. Background absolutely flat solid pure chroma green #00ff00 edge to edge, no sky, haze, texture or shadow in background; no green anywhere on building. No people, letters, numbers, symbols or writing. Blank signs. Building: Stone Street pharmacy, one pale masonry shop with stepped gable, bottles and blank circular sign


## 家：10

Square 1:1 game map asset. One single building centered large, viewed slightly from an angle, only a small patch of cobblestones under its feet. Match key-a4-1.png as style reference: Japanese paper and letterpress ink print illustration, thick navy outlines, flat fills, paper texture on building, palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, warm gold #f2b84b. ALL windows dark and unlit. Background absolutely flat solid pure chroma green #00ff00 edge to edge, no sky, haze, texture or shadow in background; no green anywhere on building. No people, letters, numbers, symbols or writing. Blank signs. Building: Sea Road Books, bookshop with tall gambrel roof, stacked books and blank open-book-shaped sign without markings


## 家：11

Square 1:1 game map asset. One single building centered large, viewed slightly from an angle, only a small patch of cobblestones under its feet. Match key-a4-1.png as style reference: Japanese paper and letterpress ink print illustration, thick navy outlines, flat fills, paper texture on building, palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, warm gold #f2b84b. ALL windows dark and unlit. Background absolutely flat solid pure chroma green #00ff00 edge to edge, no sky, haze, texture or shadow in background; no green anywhere on building. No people, letters, numbers, symbols or writing. Blank signs. Building: town public notice office for everyone in Yosuga Port, small civic building with columned porch and blank rectangular noticeboard


## 家：12

Square 1:1 game map asset. One single building centered large, viewed slightly from an angle, only a small patch of cobblestones under its feet. Match key-a4-1.png as style reference: Japanese paper and letterpress ink print illustration, thick navy outlines, flat fills, paper texture on building, palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, warm gold #f2b84b. ALL windows dark and unlit. Background absolutely flat solid pure chroma green #00ff00 edge to edge, no sky, haze, texture or shadow in background; no green anywhere on building. No people, letters, numbers, symbols or writing. Blank signs. Building: Corner Cafe, corner building with curved awning, outdoor empty chair and blank teapot-shaped sign


## 家：13

Square 1:1 game map asset. One single building centered large, viewed slightly from an angle, only a small patch of cobblestones under its feet. Match key-a4-1.png as style reference: Japanese paper and letterpress ink print illustration, thick navy outlines, flat fills, paper texture on building, palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, warm gold #f2b84b. ALL windows dark and unlit. Background absolutely flat solid pure chroma green #00ff00 edge to edge, no sky, haze, texture or shadow in background; no green anywhere on building. No people, letters, numbers, symbols or writing. Blank signs. Building: Kumo Sweets, confectionery shop with scalloped roof trim, cake display and blank cloud-shaped sign


## 家：14

Square 1:1 game map asset. One single building centered large, viewed slightly from an angle, only a small patch of cobblestones under its feet. Match key-a4-1.png as style reference: Japanese paper and letterpress ink print illustration, thick navy outlines, flat fills, paper texture on building, palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, warm gold #f2b84b. ALL windows dark and unlit. Background absolutely flat solid pure chroma green #00ff00 edge to edge, no sky, haze, texture or shadow in background; no green anywhere on building. No people, letters, numbers, symbols or writing. Blank signs. Building: post office for Tsumugi, broad hip roof post office with upper bay window, red mailbox and parcel stack

## 家：29
港の住民への掲示を置く、段状の切妻と楕円の無地掲示板を持つ小さな公共会館。

## 家：30
港町の役場。寄棟屋根と中央のアーチ入口を持つ四角い石造の行政庁舎。

## 家：31
役場の記録室。かまぼこ形の屋根を持つ細身の耐火書庫。

## 家：32
町議会の議場。低いドーム屋根を持つ半円形の会議堂。

## 家：33
町議会への手紙を届ける、急勾配の切妻屋根と出窓を持つ議会別館。

## 家：34
ツムギの部屋がある郵便局。屋根窓と赤い郵便ポスト。

## 家：35
町の家々を代表する、煙突とバルコニーのある非対称の小さな家。

## 家：36
町の記録を保管する書庫。のこぎり屋根と鉄張りの扉を持つ石造建築。

## 家：37
ソラの滞在する駅前ホテル。マンサード屋根とバルコニー。

## 家：38
ホテル従業員への手紙を届ける駅前ホテル。縞の日よけと無地の楕円看板。

## 家：39
ソラの滞在する駅前の角ホテル。細身の建物と小塔。

## 家：40
乗客への掲示を置く、ガラスのひさしがある横長の駅舎。

## 家：41
ハトリ局長の郵便局。切妻屋根と赤い郵便ポスト。

## 家：42
ナギ船長の住まい。曲線屋根とロープの装飾がある船乗りの家。

共通指示：添付のキービジュアルに合わせた紙と活版インクの版画風。太めの紺線と平塗り。紺 #1f2a44、紙 #f3ead8、朱 #c8462f、霧 #9fb3bf、灯り #f2b84b。正方形に建物を1棟大きく中央配置し、少し斜めから描く。足元に小さな石だたみ。窓は暗く無灯火。人物、文字、数字、記号を入れない。背景は影や模様のない純粋な緑 #00ff00 一色。建物には緑を使わない。


## 家：43

Square 1:1 game map asset. One single building centered large, seen from a slight three-quarter angle, only a small patch of cobblestones at its feet. Match the attached key visual’s Japanese storybook paper and letterpress print aesthetic: bold navy outlines, flat ink colors, subtle paper texture. Palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, amber #f2b84b. All windows dark and unlit. Background absolutely flat pure chroma green #00ff00 edge to edge, no sky, fog, shadow or texture in background. No green on building. No text, letters, numbers, symbols or people. No other buildings. Subject: 43: station hotel front desk building, tall narrow mansard roof, arched entrance and blank oval hanging sign.


## 家：44

Square 1:1 game map asset. One single building centered large, seen from a slight three-quarter angle, only a small patch of cobblestones at its feet. Match the attached key visual’s Japanese storybook paper and letterpress print aesthetic: bold navy outlines, flat ink colors, subtle paper texture. Palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, amber #f2b84b. All windows dark and unlit. Background absolutely flat pure chroma green #00ff00 edge to edge, no sky, fog, shadow or texture in background. No green on building. No text, letters, numbers, symbols or people. No other buildings. Subject: 44: Mayor Tobe’s residence, stately townhouse with stepped gable roof, bay window and blank shield sign.


## 家：45

Square 1:1 game map asset. One single building centered large, seen from a slight three-quarter angle, only a small patch of cobblestones at its feet. Match the attached key visual’s Japanese storybook paper and letterpress print aesthetic: bold navy outlines, flat ink colors, subtle paper texture. Palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, amber #f2b84b. All windows dark and unlit. Background absolutely flat pure chroma green #00ff00 edge to edge, no sky, fog, shadow or texture in background. No green on building. No text, letters, numbers, symbols or people. No other buildings. Subject: 45: Ms. Sora’s hotel, elegant rounded corner building with domed roof and blank fan-shaped sign.


## 家：46

Square 1:1 game map asset. One single building centered large, seen from a slight three-quarter angle, only a small patch of cobblestones at its feet. Match the attached key visual’s Japanese storybook paper and letterpress print aesthetic: bold navy outlines, flat ink colors, subtle paper texture. Palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, amber #f2b84b. All windows dark and unlit. Background absolutely flat pure chroma green #00ff00 edge to edge, no sky, fog, shadow or texture in background. No green on building. No text, letters, numbers, symbols or people. No other buildings. Subject: 46: Tsumugi’s post office with upstairs room, red tiled gable, exterior stairs and red postbox.


## 家：47

Square 1:1 game map asset. One single building centered large, seen from a slight three-quarter angle, only a small patch of cobblestones at its feet. Match the attached key visual’s Japanese storybook paper and letterpress print aesthetic: bold navy outlines, flat ink colors, subtle paper texture. Palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, amber #f2b84b. All windows dark and unlit. Background absolutely flat pure chroma green #00ff00 edge to edge, no sky, fog, shadow or texture in background. No green on building. No text, letters, numbers, symbols or people. No other buildings. Subject: 47: cape path walkers’ shelter, tiny open-sided stone rest house with hipped roof and blank rectangular sign.


## 家：48

Square 1:1 game map asset. One single building centered large, seen from a slight three-quarter angle, only a small patch of cobblestones at its feet. Match the attached key visual’s Japanese storybook paper and letterpress print aesthetic: bold navy outlines, flat ink colors, subtle paper texture. Palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, amber #f2b84b. All windows dark and unlit. Background absolutely flat pure chroma green #00ff00 edge to edge, no sky, fog, shadow or texture in background. No green on building. No text, letters, numbers, symbols or people. No other buildings. Subject: 48: cape lighthouse containing the keeper’s log, white tapered stone tower with dark unlit lantern and conical roof.


## 家：49

Square 1:1 game map asset. One single building centered large, seen from a slight three-quarter angle, only a small patch of cobblestones at its feet. Match the attached key visual’s Japanese storybook paper and letterpress print aesthetic: bold navy outlines, flat ink colors, subtle paper texture. Palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, amber #f2b84b. All windows dark and unlit. Background absolutely flat pure chroma green #00ff00 edge to edge, no sky, fog, shadow or texture in background. No green on building. No text, letters, numbers, symbols or people. No other buildings. Subject: 49: lighthouse keeper Shirase’s cottage containing his diary, low stone house with steep red gable roof and chimney.


## 家：50

Square 1:1 game map asset. One single building centered large, seen from a slight three-quarter angle, only a small patch of cobblestones at its feet. Match the attached key visual’s Japanese storybook paper and letterpress print aesthetic: bold navy outlines, flat ink colors, subtle paper texture. Palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, amber #f2b84b. All windows dark and unlit. Background absolutely flat pure chroma green #00ff00 edge to edge, no sky, fog, shadow or texture in background. No green on building. No text, letters, numbers, symbols or people. No other buildings. Subject: 50: keeper Shirase’s diary cottage, compact timber cottage with saltbox roof and shuttered round attic window.


## 家：51

Square 1:1 game map asset. One single building centered large, seen from a slight three-quarter angle, only a small patch of cobblestones at its feet. Match the attached key visual’s Japanese storybook paper and letterpress print aesthetic: bold navy outlines, flat ink colors, subtle paper texture. Palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, amber #f2b84b. All windows dark and unlit. Background absolutely flat pure chroma green #00ff00 edge to edge, no sky, fog, shadow or texture in background. No green on building. No text, letters, numbers, symbols or people. No other buildings. Subject: 51: keeper Shirase’s diary cottage, small stone cottage with curved roof and enclosed porch.


## 家：52

Square 1:1 game map asset. One single building centered large, seen from a slight three-quarter angle, only a small patch of cobblestones at its feet. Match the attached key visual’s Japanese storybook paper and letterpress print aesthetic: bold navy outlines, flat ink colors, subtle paper texture. Palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, amber #f2b84b. All windows dark and unlit. Background absolutely flat pure chroma green #00ff00 edge to edge, no sky, fog, shadow or texture in background. No green on building. No text, letters, numbers, symbols or people. No other buildings. Subject: 52: town hall where Yosuga Port’s unsent letter is kept, modest civic building with square bell turret and broad steps.


## 家：53

Square 1:1 game map asset. One single building centered large, seen from a slight three-quarter angle, only a small patch of cobblestones at its feet. Match the attached key visual’s Japanese storybook paper and letterpress print aesthetic: bold navy outlines, flat ink colors, subtle paper texture. Palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, amber #f2b84b. All windows dark and unlit. Background absolutely flat pure chroma green #00ff00 edge to edge, no sky, fog, shadow or texture in background. No green on building. No text, letters, numbers, symbols or people. No other buildings. Subject: 53: Blank & Co. office, narrow coastal business building with flat parapet and blank diamond sign.


## 家：54

Square 1:1 game map asset. One single building centered large, seen from a slight three-quarter angle, only a small patch of cobblestones at its feet. Match the attached key visual’s Japanese storybook paper and letterpress print aesthetic: bold navy outlines, flat ink colors, subtle paper texture. Palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, amber #f2b84b. All windows dark and unlit. Background absolutely flat pure chroma green #00ff00 edge to edge, no sky, fog, shadow or texture in background. No green on building. No text, letters, numbers, symbols or people. No other buildings. Subject: 54: town community hall for the people, broad symmetrical building with triangular pediment and blank circular sign.


## 家：55

Square 1:1 game map asset. One single building centered large, seen from a slight three-quarter angle, only a small patch of cobblestones at its feet. Match the attached key visual’s Japanese storybook paper and letterpress print aesthetic: bold navy outlines, flat ink colors, subtle paper texture. Palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, amber #f2b84b. All windows dark and unlit. Background absolutely flat pure chroma green #00ff00 edge to edge, no sky, fog, shadow or texture in background. No green on building. No text, letters, numbers, symbols or people. No other buildings. Subject: 55: cape light keeper’s dwelling, sturdy stone cottage with lean-to roof, chimney and coiled rope.


## 家：56

Square 1:1 game map asset. One single building centered large, seen from a slight three-quarter angle, only a small patch of cobblestones at its feet. Match the attached key visual’s Japanese storybook paper and letterpress print aesthetic: bold navy outlines, flat ink colors, subtle paper texture. Palette navy #1f2a44, paper #f3ead8, vermilion #c8462f, mist #9fb3bf, amber #f2b84b. All windows dark and unlit. Background absolutely flat pure chroma green #00ff00 edge to edge, no sky, fog, shadow or texture in background. No green on building. No text, letters, numbers, symbols or people. No other buildings. Subject: 56: Mr. Shirase’s lighthouse keeper cottage, asymmetrical cottage with red hipped roof, small porch and stone chimney.

## 家：15
新聞の読者が集う閲覧室。階段状の切妻、大きな展示窓、無地の紙形の吊り看板。

## 家：16
ツムギの郵便局2階の小部屋。朱色の寄棟屋根、ドーマー窓、赤い郵便受け。

## 家：17
入荷帳を置く港の倉庫事務所。のこぎり屋根、無地の帳簿形看板、木箱。

## 家：18
荷主のための港の海運代理店。細長いマンサード屋根、無地の楕円看板、荷物。

## 家：19
税関からの届け先である倉庫。幅広い腰折れ屋根、大きな両開き荷役扉、ロープ。

## 家：20
波止場のみんなの共同小屋。低い曲線屋根、無地の丸い吊り看板、係船柱。

## 家：21
波止場の作業員の事務所。片流れ屋根、屋根付き玄関、無地の長方形掲示板。

## 家：22
ツムギの郵便局2階の小部屋。塔のように細い建物、急勾配の朱屋根、張り出し窓。

## 家：23
よすが丸のファイルを保管する港の保険資料館。頑丈な煉瓦造り、平らな胸壁、無地の盾形看板。

## 家：24
航海日誌を置く港の船長の記録小屋。船形の屋根、丸窓、外に錨。

## 家：25
海運会社の取引先の港の商館。高い双子の切妻、日よけ、無地の菱形看板。

## 家：26
書類の届け先である町役場。正面の破風と階段がある格式ある石造建築、時計なし。

## 家：27
来訪者のための町役場入口。時計塔、アーチ状の玄関、文字も針もない時計面。

## 家：28
記録係の責任者の執務室。細い独立した役場資料館、八角屋根、無地の書類棚形看板。

各画像共通：1:1、建物1棟を中央に大きく少し斜めから、足元だけ小さな石だたみ。添付キービジュアルの紙と活版インクの版画風、太めの紺線、平塗り。紺 #1f2a44、紙 #f3ead8、朱 #c8462f、霧 #9fb3bf、灯り #f2b84b。窓は暗く消灯。背景は影や模様のない純緑 #00ff00 一色、建物には緑を使わない。文字・数字・記号・人物なし。建物の形、屋根、無地の看板、小物を描き分ける。
