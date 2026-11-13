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

## 単語の絵：c1-001

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the five attached enemy illustrations: paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains come alive as a slightly cute spooky monster, white eyes. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols except the explicitly requested visual motif; no existing characters.
Subject: say/talk/tell/speak: ink blob with a huge open mouth shouting out a big blank speech bubble.

## 単語の絵：c1-002

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the five attached enemy illustrations: paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains come alive as a slightly cute spooky monster, white eyes. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols except the explicitly requested visual motif; no existing characters.
Subject: think/idea: ink creature with steam and small gears rising from its head, a large glowing light bulb floating above.

## 単語の絵：c1-003

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the five attached enemy illustrations: paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains come alive as a slightly cute spooky monster, white eyes. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols except the explicitly requested visual motif; no existing characters.
Subject: know/sure: confident ink creature with a glowing light bulb in its chest, arms crossed, a large check mark badge.

## 単語の絵：c1-004

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the five attached enemy illustrations: paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains come alive as a slightly cute spooky monster, white eyes. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols except the explicitly requested visual motif; no existing characters.
Subject: study/learn/school: ink creature in a mortarboard and round glasses reading a stack of books, school bell and pencil behind its ear.

## 単語の絵：c1-005

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the five attached enemy illustrations: paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains come alive as a slightly cute spooky monster, white eyes. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols except the explicitly requested visual motif; no existing characters.
Subject: see/look/view: ink creature with one huge white eyeball and binoculars gazing at a distant scenic hill.

## 単語の絵：c1-006

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the five attached enemy illustrations: paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains come alive as a slightly cute spooky monster, white eyes. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols except the explicitly requested visual motif; no existing characters.
Subject: hear/feel: ink creature with a giant ear and one hand on its heart, fingertips touching a fluffy cloud, sound waves curling toward it.

## 単語の絵：c1-007

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the five attached enemy illustrations: paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains come alive as a slightly cute spooky monster, white eyes. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols except the explicitly requested visual motif; no existing characters.
Subject: time/hour/term: ink creature whose round body is a clock face with hands but no numbers or marks, holding a small hourglass, tiny gears showing.

## 単語の絵：c1-008

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the five attached enemy illustrations: paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains come alive as a slightly cute spooky monster, white eyes. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols except the explicitly requested visual motif; no existing characters.
Subject: day/today: ink creature with a large sun for a head, rays around it, cheerful morning pose, white eyes.

## 単語の絵：c1-009

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the five attached enemy illustrations: paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains come alive as a slightly cute spooky monster, white eyes. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols except the explicitly requested visual motif; no existing characters.
Subject: night: sleepy ink creature wearing a nightcap beneath a large crescent moon and stars.

## 単語の絵：c1-010

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the five attached enemy illustrations: paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains come alive as a slightly cute spooky monster, white eyes. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols except the explicitly requested visual motif; no existing characters.
Subject: week/month/year/age: ink creature whose body is a torn calendar page with a grid of blank squares and a birthday candle on top, no writing.

## 単語の絵：c1-011

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the five attached enemy illustrations: paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains come alive as a slightly cute spooky monster, white eyes. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols except the explicitly requested visual motif; no existing characters.
Subject: early: ink creature greeting a sunrise, with a rooster crest and a toothbrush, fresh and wide awake.

## 単語の絵：c1-012

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the five attached enemy illustrations: paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains come alive as a slightly cute spooky monster, white eyes. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols except the explicitly requested visual motif; no existing characters.
Subject: late: ink creature rushing and panting with a clock chasing it, messy hair, a bit sleepy, clock has no numbers.


## 単語の絵：c1-055

Square game enemy illustration for find: an ink monster with a large magnifying glass surprised to discover a hidden treasure chest. Match reference style: paper and letterpress ink print, thick navy outlines, flat navy, mist, paper and a little vermilion, textured ink stain monster with white eyes. Full body centered, clear meaning. Pure flat solid #00ff00 green background, no ground or shadows, no green on subject. No text, letters, numbers or symbols.

## 単語の絵：c1-051

Square game enemy illustration. Match the reference images: Japanese paper and letterpress ink printmaking, thick navy outlines, flat color blocks, paper texture, a slightly cute spooky living ink stain with white eyes. Navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Full body, centered, clear meaning. Flat pure green #00ff00 background, no ground or shadows, no green on subjects. No writing, letters, numbers, symbols or existing characters. Subject: line: a single ink monster with several tiny ink droplet companions queued in a clear straight row.

## 単語の絵：c1-052

Square game enemy illustration. Match the reference images: Japanese paper and letterpress ink printmaking, thick navy outlines, flat color blocks, paper texture, a slightly cute spooky living ink stain with white eyes. Navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Full body, centered, clear meaning. Flat pure green #00ff00 background, no ground or shadows, no green on subjects. No writing, letters, numbers, symbols or existing characters. Subject: side: a single ink monster shown in unmistakable full-body side profile, facing left.

## 単語の絵：c1-053

Square game enemy illustration. Match reference images: Japanese paper and letterpress ink printmaking, thick navy outlines, flat distinct color blocks, visible paper texture, living ink stain monster, slightly cute and spooky, white eyes. Restricted palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Full body, large centered composition, oversized immediately recognizable meaning. Background completely flat pure solid green #00ff00, no shadows, ground or pattern. No green on subjects. No writing, letters, numbers, symbols or glyphs anywhere. No existing characters. back: ink monster turned away showing its back, spine ridge and small backpack, looking over shoulder.

## 単語の絵：c1-054

Square game enemy illustration. Match reference images: Japanese paper and letterpress ink printmaking, thick navy outlines, flat distinct color blocks, visible paper texture, living ink stain monster, slightly cute and spooky, white eyes. Restricted palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Full body, large centered composition, oversized immediately recognizable meaning. Background completely flat pure solid green #00ff00, no shadows, ground or pattern. No green on subjects. No writing, letters, numbers, symbols or glyphs anywhere. No existing characters. turn/move: ink monster pushing a cart piled with boxes, leaning sharply around a curve, motion shown by flowing ink trails.


## 単語の絵：c1-031

Square game illustration matching reference images' style and ink monster design: paper and letterpress ink print, thick navy outlines, flat discrete color blocks, paper grain, ink stain monster with white eyes, slightly cute and eerie. Main colors navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Meaning immediately obvious. Full body centered and large. Background flat pure green #00ff00, no ground shadow, gradient or pattern; no green inside subjects. No text, letters, numbers, symbols or writing, no existing copyrighted characters. bad: grumpy creature giving a thumbs down under a small storm cloud with lightning


## 単語の絵：c1-032

Square game illustration matching reference images' style and ink monster design: paper and letterpress ink print, thick navy outlines, flat discrete color blocks, paper grain, ink stain monster with white eyes, slightly cute and eerie. Main colors navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Meaning immediately obvious. Full body centered and large. Background flat pure green #00ff00, no ground shadow, gradient or pattern; no green inside subjects. No text, letters, numbers, symbols or writing, no existing copyrighted characters. big/large: huge creature towering over tiny houses, one foot taller than a tree


## 単語の絵：c1-033

Square game illustration matching reference images' style and ink monster design: paper and letterpress ink print, thick navy outlines, flat discrete color blocks, paper grain, ink stain monster with white eyes, slightly cute and eerie. Main colors navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Meaning immediately obvious. Full body centered and large. Background flat pure green #00ff00, no ground shadow, gradient or pattern; no green inside subjects. No text, letters, numbers, symbols or writing, no existing copyrighted characters. small: tiny creature next to a giant button for scale, peering up


## 単語の絵：c1-034

Square game illustration matching reference images' style and ink monster design: paper and letterpress ink print, thick navy outlines, flat discrete color blocks, paper grain, ink stain monster with white eyes, slightly cute and eerie. Main colors navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Meaning immediately obvious. Full body centered and large. Background flat pure green #00ff00, no ground shadow, gradient or pattern; no green inside subjects. No text, letters, numbers, symbols or writing, no existing copyrighted characters. long/far: stretched-out snake-like creature winding across a long road toward a tiny faraway horizon, holding a telescope


## 単語の絵：c1-035

Square game illustration matching reference images' style and ink monster design: paper and letterpress ink print, thick navy outlines, flat discrete color blocks, paper grain, ink stain monster with white eyes, slightly cute and eerie. Main colors navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Meaning immediately obvious. Full body centered and large. Background flat pure green #00ff00, no ground shadow, gradient or pattern; no green inside subjects. No text, letters, numbers, symbols or writing, no existing copyrighted characters. high: creature on tiptoe on stacked boxes, reaching clouds


## 単語の絵：c1-036

Square game illustration matching reference images' style and ink monster design: paper and letterpress ink print, thick navy outlines, flat discrete color blocks, paper grain, ink stain monster with white eyes, slightly cute and eerie. Main colors navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Meaning immediately obvious. Full body centered and large. Background flat pure green #00ff00, no ground shadow, gradient or pattern; no green inside subjects. No text, letters, numbers, symbols or writing, no existing copyrighted characters. low: flat squashed creature crawling under a low bar, close to the ground


## 単語の絵：c1-037

Square game illustration matching reference images' style and ink monster design: paper and letterpress ink print, thick navy outlines, flat discrete color blocks, paper grain, ink stain monster with white eyes, slightly cute and eerie. Main colors navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Meaning immediately obvious. Full body centered and large. Background flat pure green #00ff00, no ground shadow, gradient or pattern; no green inside subjects. No text, letters, numbers, symbols or writing, no existing copyrighted characters. people/public/group/member: crowd of small creatures wearing matching blank badge ribbons, standing shoulder to shoulder


## 単語の絵：c1-038

Square game illustration matching reference images' style and ink monster design: paper and letterpress ink print, thick navy outlines, flat discrete color blocks, paper grain, ink stain monster with white eyes, slightly cute and eerie. Main colors navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Meaning immediately obvious. Full body centered and large. Background flat pure green #00ff00, no ground shadow, gradient or pattern; no green inside subjects. No text, letters, numbers, symbols or writing, no existing copyrighted characters. person: single creature standing upright in a human-shaped outline with a round head, hat and coat


## 単語の絵：c1-039

Square game illustration matching reference images' style and ink monster design: paper and letterpress ink print, thick navy outlines, flat discrete color blocks, paper grain, ink stain monster with white eyes, slightly cute and eerie. Main colors navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Meaning immediately obvious. Full body centered and large. Background flat pure green #00ff00, no ground shadow, gradient or pattern; no green inside subjects. No text, letters, numbers, symbols or writing, no existing copyrighted characters. man: creature with a bowler hat, mustache and necktie


## 単語の絵：c1-040

Square game illustration matching reference images' style and ink monster design: paper and letterpress ink print, thick navy outlines, flat discrete color blocks, paper grain, ink stain monster with white eyes, slightly cute and eerie. Main colors navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Meaning immediately obvious. Full body centered and large. Background flat pure green #00ff00, no ground shadow, gradient or pattern; no green inside subjects. No text, letters, numbers, symbols or writing, no existing copyrighted characters. woman: creature with long wavy hair, ribbon hat and earring


## 単語の絵：c1-041

Square game illustration matching reference images' style and ink monster design: paper and letterpress ink print, thick navy outlines, flat discrete color blocks, paper grain, ink stain monster with white eyes, slightly cute and eerie. Main colors navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Meaning immediately obvious. Full body centered and large. Background flat pure green #00ff00, no ground shadow, gradient or pattern; no green inside subjects. No text, letters, numbers, symbols or writing, no existing copyrighted characters. child: small round creature with school cap and backpack


## 単語の絵：c1-042

Square game illustration matching reference images' style and ink monster design: paper and letterpress ink print, thick navy outlines, flat discrete color blocks, paper grain, ink stain monster with white eyes, slightly cute and eerie. Main colors navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Meaning immediately obvious. Full body centered and large. Background flat pure green #00ff00, no ground shadow, gradient or pattern; no green inside subjects. No text, letters, numbers, symbols or writing, no existing copyrighted characters. parent/family: big creature holding hands with two small creatures, walking together


## 単語の絵：c1-043

Square game illustration matching reference images' style and ink monster design: paper and letterpress ink print, thick navy outlines, flat discrete color blocks, paper grain, ink stain monster with white eyes, slightly cute and eerie. Main colors navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Meaning immediately obvious. Full body centered and large. Background flat pure green #00ff00, no ground shadow, gradient or pattern; no green inside subjects. No text, letters, numbers, symbols or writing, no existing copyrighted characters. friend/meet: two creatures shaking hands with arms around each other's shoulders, smiling


## 単語の絵：c1-044

Square game illustration matching reference images' style and ink monster design: paper and letterpress ink print, thick navy outlines, flat discrete color blocks, paper grain, ink stain monster with white eyes, slightly cute and eerie. Main colors navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Meaning immediately obvious. Full body centered and large. Background flat pure green #00ff00, no ground shadow, gradient or pattern; no green inside subjects. No text, letters, numbers, symbols or writing, no existing copyrighted characters. party: creature with party hat blowing a horn, confetti and balloons


## 単語の絵：c1-045

Square game illustration matching reference images' style and ink monster design: paper and letterpress ink print, thick navy outlines, flat discrete color blocks, paper grain, ink stain monster with white eyes, slightly cute and eerie. Main colors navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Meaning immediately obvious. Full body centered and large. Background flat pure green #00ff00, no ground shadow, gradient or pattern; no green inside subjects. No text, letters, numbers, symbols or writing, no existing copyrighted characters. home/house/live/room: creature wearing a little house as a snail-like shell, chimney with smoke, lit window


## 単語の絵：c1-046

Square game illustration matching reference images' style and ink monster design: paper and letterpress ink print, thick navy outlines, flat discrete color blocks, paper grain, ink stain monster with white eyes, slightly cute and eerie. Main colors navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Meaning immediately obvious. Full body centered and large. Background flat pure green #00ff00, no ground shadow, gradient or pattern; no green inside subjects. No text, letters, numbers, symbols or writing, no existing copyrighted characters. city/place/area: creature on a map patch with a big map pin and skyscraper skyline behind


## 単語の絵：c1-047

Square game illustration matching reference images' style and ink monster design: paper and letterpress ink print, thick navy outlines, flat discrete color blocks, paper grain, ink stain monster with white eyes, slightly cute and eerie. Main colors navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Meaning immediately obvious. Full body centered and large. Background flat pure green #00ff00, no ground shadow, gradient or pattern; no green inside subjects. No text, letters, numbers, symbols or writing, no existing copyrighted characters. world: creature with globe body, recognizable continents and orbiting lines


## 単語の絵：c1-048

Square game illustration matching reference images' style and ink monster design: paper and letterpress ink print, thick navy outlines, flat discrete color blocks, paper grain, ink stain monster with white eyes, slightly cute and eerie. Main colors navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Meaning immediately obvious. Full body centered and large. Background flat pure green #00ff00, no ground shadow, gradient or pattern; no green inside subjects. No text, letters, numbers, symbols or writing, no existing copyrighted characters. local: creature in front of small neighborhood shop with awning, waving at passing cat


## 単語の絵：c1-049

Square game illustration matching reference images' style and ink monster design: paper and letterpress ink print, thick navy outlines, flat discrete color blocks, paper grain, ink stain monster with white eyes, slightly cute and eerie. Main colors navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Meaning immediately obvious. Full body centered and large. Background flat pure green #00ff00, no ground shadow, gradient or pattern; no green inside subjects. No text, letters, numbers, symbols or writing, no existing copyrighted characters. state/case/fact: creature in detective hat with magnifying glass and blank stamp, briefcase at its side


## 単語の絵：c1-050

Square game illustration matching reference images' style and ink monster design: paper and letterpress ink print, thick navy outlines, flat discrete color blocks, paper grain, ink stain monster with white eyes, slightly cute and eerie. Main colors navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Meaning immediately obvious. Full body centered and large. Background flat pure green #00ff00, no ground shadow, gradient or pattern; no green inside subjects. No text, letters, numbers, symbols or writing, no existing copyrighted characters. way: creature at forked road beside signpost with blank directional arrow shapes

## 単語の絵：c1-056

Square game enemy illustration. Match reference images: Japanese paper and letterpress ink printmaking, thick navy outlines, flat distinct color blocks, visible paper texture, living ink stain monster, slightly cute and spooky, white eyes. Restricted palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Full body, large centered composition, oversized immediately recognizable meaning. Background completely flat pure solid green #00ff00, no shadows, ground or pattern. No green on subjects. No writing, letters, numbers, symbols or glyphs anywhere. No existing characters. mean/reason: thoughtful ink monster inspecting a large object beside a glowing lightbulb, a physical chain connecting them

## 単語の絵：c1-057

Square game enemy illustration. Match reference images: Japanese paper and letterpress ink printmaking, thick navy outlines, flat distinct color blocks, visible paper texture, living ink stain monster, slightly cute and spooky, white eyes. Restricted palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Full body, large centered composition, oversized immediately recognizable meaning. Background completely flat pure solid green #00ff00, no shadows, ground or pattern. No green on subjects. No writing, letters, numbers, symbols or glyphs anywhere. No existing characters. call/ask: ink monster holding a large old telephone receiver to its ear, raised hand and curious tilted head

## 単語の絵：c1-058

Square game enemy illustration. Match reference images: Japanese paper and letterpress ink printmaking, thick navy outlines, flat distinct color blocks, visible paper texture, living ink stain monster, slightly cute and spooky, white eyes. Restricted palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Full body, large centered composition, oversized immediately recognizable meaning. Background completely flat pure solid green #00ff00, no shadows, ground or pattern. No green on subjects. No writing, letters, numbers, symbols or glyphs anywhere. No existing characters. life: ink monster with a heartbeat trace on its chest and a pale paper-colored sprout growing from its head

## 単語の絵：c1-059

Square game enemy illustration. Match reference images: Japanese paper and letterpress ink printmaking, thick navy outlines, flat distinct color blocks, visible paper texture, living ink stain monster, slightly cute and spooky, white eyes. Restricted palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Full body, large centered composition, oversized immediately recognizable meaning. Background completely flat pure solid green #00ff00, no shadows, ground or pattern. No green on subjects. No writing, letters, numbers, symbols or glyphs anywhere. No existing characters. change/happen: startled ink monster halfway between two distinct shapes, with a sudden spark and swirling ink

## 単語の絵：c1-060

Square game enemy illustration. Match reference images: Japanese paper and letterpress ink printmaking, thick navy outlines, flat distinct color blocks, visible paper texture, living ink stain monster, slightly cute and spooky, white eyes. Restricted palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Full body, large centered composition, oversized immediately recognizable meaning. Background completely flat pure solid green #00ff00, no shadows, ground or pattern. No green on subjects. No writing, letters, numbers, symbols or glyphs anywhere. No existing characters. write/read: ink monster reading a large open book while writing with a feather quill on a blank scroll

## 単語の絵：c1-061

Square game enemy illustration. Match reference images: Japanese paper and letterpress ink printmaking, thick navy outlines, flat distinct color blocks, visible paper texture, living ink stain monster, slightly cute and spooky, white eyes. Restricted palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Full body, large centered composition, oversized immediately recognizable meaning. Background completely flat pure solid green #00ff00, no shadows, ground or pattern. No green on subjects. No writing, letters, numbers, symbols or glyphs anywhere. No existing characters. book as reserve: pleased ink monster holding a large blank ticket and a blank calendar with one square highlighted

## 単語の絵：c1-062

Square game enemy illustration. Match reference images: Japanese paper and letterpress ink printmaking, thick navy outlines, flat distinct color blocks, visible paper texture, living ink stain monster, slightly cute and spooky, white eyes. Restricted palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Full body, large centered composition, oversized immediately recognizable meaning. Background completely flat pure solid green #00ff00, no shadows, ground or pattern. No green on subjects. No writing, letters, numbers, symbols or glyphs anywhere. No existing characters. word/name/story: ink monster wearing a blank name tag and holding a large open blank storybook with a fairy tale castle emerging, and a quill

## 単語の絵：c1-063

Square game enemy illustration. Match reference images: Japanese paper and letterpress ink printmaking, thick navy outlines, flat distinct color blocks, visible paper texture, living ink stain monster, slightly cute and spooky, white eyes. Restricted palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Full body, large centered composition, oversized immediately recognizable meaning. Background completely flat pure solid green #00ff00, no shadows, ground or pattern. No green on subjects. No writing, letters, numbers, symbols or glyphs anywhere. No existing characters. number/point/part: ink monster incorporated into an abacus with large counting beads, pointing at a dot and holding a pie slice

## 単語の絵：c1-064

Square game enemy illustration. Match reference images: Japanese paper and letterpress ink printmaking, thick navy outlines, flat distinct color blocks, visible paper texture, living ink stain monster, slightly cute and spooky, white eyes. Restricted palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Full body, large centered composition, oversized immediately recognizable meaning. Background completely flat pure solid green #00ff00, no shadows, ground or pattern. No green on subjects. No writing, letters, numbers, symbols or glyphs anywhere. No existing characters. whole: perfectly round ink monster with one complete unbroken circular body, tidy and satisfied

## 単語の絵：c1-066

Square game enemy illustration. Match reference images: Japanese paper and letterpress ink printmaking, thick navy outlines, flat distinct color blocks, visible paper texture, living ink stain monster, slightly cute and spooky, white eyes. Restricted palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Full body, large centered composition, oversized immediately recognizable meaning. Background completely flat pure solid green #00ff00, no shadows, ground or pattern. No green on subjects. No writing, letters, numbers, symbols or glyphs anywhere. No existing characters. kind: one ink monster surrounded by several small ink siblings of visibly different shapes in a row

## 単語の絵：c1-067

Square game enemy illustration. Match reference images: Japanese paper and letterpress ink printmaking, thick navy outlines, flat distinct color blocks, visible paper texture, living ink stain monster, slightly cute and spooky, white eyes. Restricted palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Full body, large centered composition, oversized immediately recognizable meaning. Background completely flat pure solid green #00ff00, no shadows, ground or pattern. No green on subjects. No writing, letters, numbers, symbols or glyphs anywhere. No existing characters. try: determined ink monster straining hard with a sweat drop while trying to lift an enormous heavy weight

## 単語の絵：c1-068

Square game enemy illustration. Match reference images: Japanese paper and letterpress ink printmaking, thick navy outlines, flat distinct color blocks, visible paper texture, living ink stain monster, slightly cute and spooky, white eyes. Restricted palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Full body, large centered composition, oversized immediately recognizable meaning. Background completely flat pure solid green #00ff00, no shadows, ground or pattern. No green on subjects. No writing, letters, numbers, symbols or glyphs anywhere. No existing characters. able: strong confident ink monster effortlessly lifting a large barbell with one hand and flexing

## 単語の絵：c1-069

Square game enemy illustration. Match reference images: Japanese paper and letterpress ink printmaking, thick navy outlines, flat distinct color blocks, visible paper texture, living ink stain monster, slightly cute and spooky, white eyes. Restricted palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Full body, large centered composition, oversized immediately recognizable meaning. Background completely flat pure solid green #00ff00, no shadows, ground or pattern. No green on subjects. No writing, letters, numbers, symbols or glyphs anywhere. No existing characters. start/begin: ink monster crouching ready to race at a starting line beside a plain flag and tiny pale seedling

## 単語の絵：c1-070

Square game enemy illustration. Match reference images: Japanese paper and letterpress ink printmaking, thick navy outlines, flat distinct color blocks, visible paper texture, living ink stain monster, slightly cute and spooky, white eyes. Restricted palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Full body, large centered composition, oversized immediately recognizable meaning. Background completely flat pure solid green #00ff00, no shadows, ground or pattern. No green on subjects. No writing, letters, numbers, symbols or glyphs anywhere. No existing characters. end/last: ink monster breaking a finish tape at a finish post, with tiny runners ahead

## 単語の絵：c1-065

Exactly square 1:1 image. SAME: two identical twin ink monsters in matching poses stacked closely in a compact square composition. Reference style: Japanese paper and letterpress ink printmaking, thick navy outline, flat navy #1f2a44, mist #9fb3bf, paper #f3ead8 and a little vermilion #c8462f, textured living ink stain, slightly cute spooky white eyes. Full bodies centered. Flat pure solid #00ff00 green background; no shadow or ground, no green in subjects. No text, numbers or symbols.


## 単語の絵：c1-071

Square game illustration, match the attached ink monster reference images exactly: paper and letterpress ink print, thick navy outlines, flat color masses with subtle paper grain and ink stains, cute yet spooky ink-stain creature with white eyes. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Single large central full-body monster; make the meaning visually obvious with large clear motifs. Background completely flat solid pure green #00ff00, no ground, no shadows, no pattern; no green in the subject. No text, letters, numbers, symbols, or copyrighted characters. Depict the meaning of help: ink creature reaching down a hand to pull a smaller creature up a ledge.


## 単語の絵：c1-072

Square game illustration, match the attached ink monster reference images exactly: paper and letterpress ink print, thick navy outlines, flat color masses with subtle paper grain and ink stains, cute yet spooky ink-stain creature with white eyes. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Single large central full-body monster; make the meaning visually obvious with large clear motifs. Background completely flat solid pure green #00ff00, no ground, no shadows, no pattern; no green in the subject. No text, letters, numbers, symbols, or copyrighted characters. Depict the meaning of lead: ink creature carrying a flag at the front of a line of small followers.


## 単語の絵：c1-073

Square game illustration, match the attached ink monster reference images exactly: paper and letterpress ink print, thick navy outlines, flat color masses with subtle paper grain and ink stains, cute yet spooky ink-stain creature with white eyes. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Single large central full-body monster; make the meaning visually obvious with large clear motifs. Background completely flat solid pure green #00ff00, no ground, no shadows, no pattern; no green in the subject. No text, letters, numbers, symbols, or copyrighted characters. Depict the meaning of put/set/stand: ink creature standing very upright on sturdy legs, carefully placing a cube on a shelf, tools laid out neatly.


## 単語の絵：c1-074

Square game illustration, match the attached ink monster reference images exactly: paper and letterpress ink print, thick navy outlines, flat color masses with subtle paper grain and ink stains, cute yet spooky ink-stain creature with white eyes. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Single large central full-body monster; make the meaning visually obvious with large clear motifs. Background completely flat solid pure green #00ff00, no ground, no shadows, no pattern; no green in the subject. No text, letters, numbers, symbols, or copyrighted characters. Depict the meaning of hold/keep: ink creature hugging a treasure chest tight with both arms and a lock.


## 単語の絵：c1-075

Square game illustration, match the attached ink monster reference images exactly: paper and letterpress ink print, thick navy outlines, flat color masses with subtle paper grain and ink stains, cute yet spooky ink-stain creature with white eyes. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Single large central full-body monster; make the meaning visually obvious with large clear motifs. Background completely flat solid pure green #00ff00, no ground, no shadows, no pattern; no green in the subject. No text, letters, numbers, symbols, or copyrighted characters. Depict the meaning of play: ink creature juggling a ball, a kite and a toy block with a joyful face.


## 単語の絵：c1-076

Square game illustration, match the attached ink monster reference images exactly: paper and letterpress ink print, thick navy outlines, flat color masses with subtle paper grain and ink stains, cute yet spooky ink-stain creature with white eyes. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Single large central full-body monster; make the meaning visually obvious with large clear motifs. Background completely flat solid pure green #00ff00, no ground, no shadows, no pattern; no green in the subject. No text, letters, numbers, symbols, or copyrighted characters. Depict the meaning of run: ink creature in an apron standing behind a shop counter, running a business with a ledger and a bell.


## 単語の絵：c1-077

Square game illustration, match the attached ink monster reference images exactly: paper and letterpress ink print, thick navy outlines, flat color masses with subtle paper grain and ink stains, cute yet spooky ink-stain creature with white eyes. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Single large central full-body monster; make the meaning visually obvious with large clear motifs. Background completely flat solid pure green #00ff00, no ground, no shadows, no pattern; no green in the subject. No text, letters, numbers, symbols, or copyrighted characters. Depict the meaning of result: ink creature next to a line of falling dominoes with the last one resting on a small trophy.


## 単語の絵：c1-078

Square game illustration, match the attached ink monster reference images exactly: paper and letterpress ink print, thick navy outlines, flat color masses with subtle paper grain and ink stains, cute yet spooky ink-stain creature with white eyes. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Single large central full-body monster; make the meaning visually obvious with large clear motifs. Background completely flat solid pure green #00ff00, no ground, no shadows, no pattern; no green in the subject. No text, letters, numbers, symbols, or copyrighted characters. Depict the meaning of system: ink creature built of interlocking gears and pipes, steam puffs.


## 単語の絵：c1-079

Square game illustration, match the attached ink monster reference images exactly: paper and letterpress ink print, thick navy outlines, flat color masses with subtle paper grain and ink stains, cute yet spooky ink-stain creature with white eyes. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Single large central full-body monster; make the meaning visually obvious with large clear motifs. Background completely flat solid pure green #00ff00, no ground, no shadows, no pattern; no green in the subject. No text, letters, numbers, symbols, or copyrighted characters. Depict the meaning of issue/hard: ink creature sweating while pushing a giant boulder up a steep hill, tangled in a knot of rope.


## 単語の絵：c1-080

Square game illustration, match the attached ink monster reference images exactly: paper and letterpress ink print, thick navy outlines, flat color masses with subtle paper grain and ink stains, cute yet spooky ink-stain creature with white eyes. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Single large central full-body monster; make the meaning visually obvious with large clear motifs. Background completely flat solid pure green #00ff00, no ground, no shadows, no pattern; no green in the subject. No text, letters, numbers, symbols, or copyrighted characters. Depict the meaning of market/order: ink creature behind a fruit stall with a striped awning, holding a waiter notepad and a small bell.


## 単語の絵：c1-081

Square game illustration, match the attached ink monster reference images exactly: paper and letterpress ink print, thick navy outlines, flat color masses with subtle paper grain and ink stains, cute yet spooky ink-stain creature with white eyes. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Single large central full-body monster; make the meaning visually obvious with large clear motifs. Background completely flat solid pure green #00ff00, no ground, no shadows, no pattern; no green in the subject. No text, letters, numbers, symbols, or copyrighted characters. Depict the meaning of build/plan: ink creature unrolling a blueprint scroll with a compass, a half-built brick wall behind it.


## 単語の絵：c1-082

Square game illustration, match the attached ink monster reference images exactly: paper and letterpress ink print, thick navy outlines, flat color masses with subtle paper grain and ink stains, cute yet spooky ink-stain creature with white eyes. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Single large central full-body monster; make the meaning visually obvious with large clear motifs. Background completely flat solid pure green #00ff00, no ground, no shadows, no pattern; no green in the subject. No text, letters, numbers, symbols, or copyrighted characters. Depict the meaning of thank: ink creature bowing politely while holding a small flower.


## 単語の絵：c1-083

Square game illustration, match the attached ink monster reference images exactly: paper and letterpress ink print, thick navy outlines, flat color masses with subtle paper grain and ink stains, cute yet spooky ink-stain creature with white eyes. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Single large central full-body monster; make the meaning visually obvious with large clear motifs. Background completely flat solid pure green #00ff00, no ground, no shadows, no pattern; no green in the subject. No text, letters, numbers, symbols, or copyrighted characters. Depict the meaning of face: ink creature bravely staring down a giant shadow with eyes wide, fists clenched.


## 単語の絵：c1-084

Square game illustration, match the attached ink monster reference images exactly: paper and letterpress ink print, thick navy outlines, flat color masses with subtle paper grain and ink stains, cute yet spooky ink-stain creature with white eyes. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Single large central full-body monster; make the meaning visually obvious with large clear motifs. Background completely flat solid pure green #00ff00, no ground, no shadows, no pattern; no green in the subject. No text, letters, numbers, symbols, or copyrighted characters. Depict the meaning of head: ink creature with an oversized round head, hands on cheeks.


## 単語の絵：c1-085

Square game illustration, match the attached ink monster reference images exactly: paper and letterpress ink print, thick navy outlines, flat color masses with subtle paper grain and ink stains, cute yet spooky ink-stain creature with white eyes. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Single large central full-body monster; make the meaning visually obvious with large clear motifs. Background completely flat solid pure green #00ff00, no ground, no shadows, no pattern; no green in the subject. No text, letters, numbers, symbols, or copyrighted characters. Depict the meaning of hand: ink creature shaped like a big open hand, each finger a small blob with eyes.


## 単語の絵：c1-086

Square game illustration, match the attached ink monster reference images exactly: paper and letterpress ink print, thick navy outlines, flat color masses with subtle paper grain and ink stains, cute yet spooky ink-stain creature with white eyes. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Single large central full-body monster; make the meaning visually obvious with large clear motifs. Background completely flat solid pure green #00ff00, no ground, no shadows, no pattern; no green in the subject. No text, letters, numbers, symbols, or copyrighted characters. Depict the meaning of car/train: ink creature with a car body, round wheels and headlight eyes, a small locomotive smoke puff above.


## 単語の絵：c1-087

Square game illustration, match the attached ink monster reference images exactly: paper and letterpress ink print, thick navy outlines, flat color masses with subtle paper grain and ink stains, cute yet spooky ink-stain creature with white eyes. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Single large central full-body monster; make the meaning visually obvious with large clear motifs. Background completely flat solid pure green #00ff00, no ground, no shadows, no pattern; no green in the subject. No text, letters, numbers, symbols, or copyrighted characters. Depict the meaning of lose: ink creature dropping coins from a hole in its pocket, looking dismayed and empty-handed.


## 単語の絵：c1-088

Square game illustration, match the attached ink monster reference images exactly: paper and letterpress ink print, thick navy outlines, flat color masses with subtle paper grain and ink stains, cute yet spooky ink-stain creature with white eyes. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Single large central full-body monster; make the meaning visually obvious with large clear motifs. Background completely flat solid pure green #00ff00, no ground, no shadows, no pattern; no green in the subject. No text, letters, numbers, symbols, or copyrighted characters. Depict the meaning of close: ink creature pulling a door shut behind itself, a latch clicked.


## 単語の絵：c1-089

Square game illustration, match the attached ink monster reference images exactly: paper and letterpress ink print, thick navy outlines, flat color masses with subtle paper grain and ink stains, cute yet spooky ink-stain creature with white eyes. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Single large central full-body monster; make the meaning visually obvious with large clear motifs. Background completely flat solid pure green #00ff00, no ground, no shadows, no pattern; no green in the subject. No text, letters, numbers, symbols, or copyrighted characters. Depict the meaning of open: ink creature standing at a wide-open door with arms spread, light pouring out.


## 単語の絵：c1-090

Square game illustration, match the attached ink monster reference images exactly: paper and letterpress ink print, thick navy outlines, flat color masses with subtle paper grain and ink stains, cute yet spooky ink-stain creature with white eyes. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Single large central full-body monster; make the meaning visually obvious with large clear motifs. Background completely flat solid pure green #00ff00, no ground, no shadows, no pattern; no green in the subject. No text, letters, numbers, symbols, or copyrighted characters. Depict the meaning of report/form: ink creature in a press cap holding a newspaper sheet and a blank form paper with empty tick boxes.


## 単語の絵：c1-091

Square game illustration, match the attached ink monster reference images exactly: paper and letterpress ink print, thick navy outlines, flat color masses with subtle paper grain and ink stains, cute yet spooky ink-stain creature with white eyes. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Single large central full-body monster; make the meaning visually obvious with large clear motifs. Background completely flat solid pure green #00ff00, no ground, no shadows, no pattern; no green in the subject. No text, letters, numbers, symbols, or copyrighted characters. Depict the meaning of follow/next: ink creature trailing behind a line of footprints with a lantern, peeking toward the next step ahead.

## 単語の絵：c1-003

know/sure

Create one square game illustration matching the attached ink monster references exactly in woodblock and letterpress paper texture, thick navy outlines, flat limited navy #1f2a44, mist #9fb3bf, paper #f3ead8 and small vermilion #c8462f. One full-body cute eerie ink stain creature with white eyes, centered large, holding a closed thick book under its arm, chin up, smug confident grin, tapping its own head with one finger, clearly conveying knowing. Solid pure green #00ff00 background only, no floor or shadows; no green in subject. No text, numbers, symbols or checkmarks.

## 単語の絵：c1-006

hear

Create one square game illustration matching the attached ink monster references exactly: paper and letterpress woodblock print, thick navy outlines, flat color blocks with subtle ink and paper texture; palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. One full-body cute eerie living ink stain monster with white eyes, centered large. Meaning must be immediately obvious from large clear action and objects. Subject: one enormous cupped ear, listening intently with closed eyes; visible curved sound waves flowing into the ear, without musical note symbols. Background must be perfectly flat solid pure green #00ff00, no floor, cast shadows, gradient or pattern; no green on creature or objects. No writing, letters, numbers, marks or symbols. No known copyrighted characters.

## 単語の絵：c1-011

early

Create one square game illustration matching the attached ink monster references exactly: paper and letterpress woodblock print, thick navy outlines, flat color blocks with subtle ink and paper texture; palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. One full-body cute eerie living ink stain monster with white eyes, centered large. Meaning must be immediately obvious from large clear action and objects. Subject: yawning and stretching beside a candle, a tiny rooster crowing on its shoulder, with a small dark sky vignette showing stars and a thin predawn horizon. Background must be perfectly flat solid pure green #00ff00, no floor, cast shadows, gradient or pattern; no green on creature or objects. No writing, letters, numbers, marks or symbols. No known copyrighted characters.

## 単語の絵：c1-013

come

Create one square game illustration matching the attached ink monster references exactly: paper and letterpress woodblock print, thick navy outlines, flat color blocks with subtle ink and paper texture; palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. One full-body cute eerie living ink stain monster with white eyes, centered large. Meaning must be immediately obvious from large clear action and objects. Subject: walking toward the viewer, one hand beckoning, with a trail of footprints behind it. Background must be perfectly flat solid pure green #00ff00, no floor, cast shadows, gradient or pattern; no green on creature or objects. No writing, letters, numbers, marks or symbols. No known copyrighted characters.

## 単語の絵：c1-014

leave

Create one square game illustration matching the attached ink monster references exactly: paper and letterpress woodblock print, thick navy outlines, flat color blocks with subtle ink and paper texture; palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. One full-body cute eerie living ink stain monster with white eyes, centered large. Meaning must be immediately obvious from large clear action and objects. Subject: walking out through an open door with a small suitcase and waving goodbye. Background must be perfectly flat solid pure green #00ff00, no floor, cast shadows, gradient or pattern; no green on creature or objects. No writing, letters, numbers, marks or symbols. No known copyrighted characters.

## 単語の絵：c1-015

become

Create one square game illustration matching the attached ink monster references exactly: paper and letterpress woodblock print, thick navy outlines, flat color blocks with subtle ink and paper texture; palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. One full-body cute eerie living ink stain monster with white eyes, centered large. Meaning must be immediately obvious from large clear action and objects. Subject: halfway transforming from ink blob into a large star-shaped body, with curved transformation trails. Background must be perfectly flat solid pure green #00ff00, no floor, cast shadows, gradient or pattern; no green on creature or objects. No writing, letters, numbers, marks or symbols. No known copyrighted characters.

## 単語の絵：c1-016

work/job

Create one square game illustration matching the attached ink monster references exactly: paper and letterpress woodblock print, thick navy outlines, flat color blocks with subtle ink and paper texture; palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. One full-body cute eerie living ink stain monster with white eyes, centered large. Meaning must be immediately obvious from large clear action and objects. Subject: wearing a hard hat and holding a large wrench and lunch box, with a sweat drop. Background must be perfectly flat solid pure green #00ff00, no floor, cast shadows, gradient or pattern; no green on creature or objects. No writing, letters, numbers, marks or symbols. No known copyrighted characters.

## 単語の絵：c1-017

use

Create one square game illustration matching the attached ink monster references exactly: paper and letterpress woodblock print, thick navy outlines, flat color blocks with subtle ink and paper texture; palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. One full-body cute eerie living ink stain monster with white eyes, centered large. Meaning must be immediately obvious from large clear action and objects. Subject: gripping and actively using a large tool on an object, with luminous rays around the working tool. Background must be perfectly flat solid pure green #00ff00, no floor, cast shadows, gradient or pattern; no green on creature or objects. No writing, letters, numbers, marks or symbols. No known copyrighted characters.

## 単語の絵：c1-018

want/need

Create one square game illustration matching the attached ink monster references exactly: paper and letterpress woodblock print, thick navy outlines, flat color blocks with subtle ink and paper texture; palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. One full-body cute eerie living ink stain monster with white eyes, centered large. Meaning must be immediately obvious from large clear action and objects. Subject: hungry wide white eyes, reaching both hands toward a large glowing treasure, drooling a little. Background must be perfectly flat solid pure green #00ff00, no floor, cast shadows, gradient or pattern; no green on creature or objects. No writing, letters, numbers, marks or symbols. No known copyrighted characters.

## 単語の絵：c1-019

hope

Create one square game illustration matching the attached ink monster references exactly: paper and letterpress woodblock print, thick navy outlines, flat color blocks with subtle ink and paper texture; palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. One full-body cute eerie living ink stain monster with white eyes, centered large. Meaning must be immediately obvious from large clear action and objects. Subject: clasping its hands and looking up at a single shooting star. Background must be perfectly flat solid pure green #00ff00, no floor, cast shadows, gradient or pattern; no green on creature or objects. No writing, letters, numbers, marks or symbols. No known copyrighted characters.

## 単語の絵：c1-020

love

Create one square game illustration matching the attached ink monster references exactly: paper and letterpress woodblock print, thick navy outlines, flat color blocks with subtle ink and paper texture; palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. One full-body cute eerie living ink stain monster with white eyes, centered large. Meaning must be immediately obvious from large clear action and objects. Subject: hugging an enormous heart tightly, with little hearts floating around it. Background must be perfectly flat solid pure green #00ff00, no floor, cast shadows, gradient or pattern; no green on creature or objects. No writing, letters, numbers, marks or symbols. No known copyrighted characters.

## 単語の絵：c1-021

give/offer

Create one square game illustration matching the attached ink monster references exactly: paper and letterpress woodblock print, thick navy outlines, flat color blocks with subtle ink and paper texture; palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. One full-body cute eerie living ink stain monster with white eyes, centered large. Meaning must be immediately obvious from large clear action and objects. Subject: leaning forward and holding out a large ribboned gift box with both hands. Background must be perfectly flat solid pure green #00ff00, no floor, cast shadows, gradient or pattern; no green on creature or objects. No writing, letters, numbers, marks or symbols. No known copyrighted characters.

## 単語の絵：c1-022

show

Create one square game illustration matching the attached ink monster references exactly: paper and letterpress woodblock print, thick navy outlines, flat color blocks with subtle ink and paper texture; palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. One full-body cute eerie living ink stain monster with white eyes, centered large. Meaning must be immediately obvious from large clear action and objects. Subject: holding up a big empty picture frame and pointing at it proudly. Background must be perfectly flat solid pure green #00ff00, no floor, cast shadows, gradient or pattern; no green on creature or objects. No writing, letters, numbers, marks or symbols. No known copyrighted characters.

## 単語の絵：c1-023

bring

Create one square game illustration matching the attached ink monster references exactly: paper and letterpress woodblock print, thick navy outlines, flat color blocks with subtle ink and paper texture; palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. One full-body cute eerie living ink stain monster with white eyes, centered large. Meaning must be immediately obvious from large clear action and objects. Subject: walking while carrying a large parcel tied with string in both arms. Background must be perfectly flat solid pure green #00ff00, no floor, cast shadows, gradient or pattern; no green on creature or objects. No writing, letters, numbers, marks or symbols. No known copyrighted characters.

## 単語の絵：c1-024

pay/buy/spend

Create one square game illustration matching the attached ink monster references exactly: paper and letterpress woodblock print, thick navy outlines, flat color blocks with subtle ink and paper texture; palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. One full-body cute eerie living ink stain monster with white eyes, centered large. Meaning must be immediately obvious from large clear action and objects. Subject: handing coins across a shop counter and receiving a small bag, coins coming out of its purse. Background must be perfectly flat solid pure green #00ff00, no floor, cast shadows, gradient or pattern; no green on creature or objects. No writing, letters, numbers, marks or symbols. No known copyrighted characters.

## 単語の絵：c1-025

money

Create one square game illustration matching the attached ink monster references exactly: paper and letterpress woodblock print, thick navy outlines, flat color blocks with subtle ink and paper texture; palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. One full-body cute eerie living ink stain monster with white eyes, centered large. Meaning must be immediately obvious from large clear action and objects. Subject: made of clearly visible stacked coins and a large coin bag, with shiny coins piled on top; no currency symbols. Background must be perfectly flat solid pure green #00ff00, no floor, cast shadows, gradient or pattern; no green on creature or objects. No writing, letters, numbers, marks or symbols. No known copyrighted characters.

## 単語の絵：c1-026

cost/price/rate/level

Create one square game illustration matching the attached ink monster references exactly: paper and letterpress woodblock print, thick navy outlines, flat color blocks with subtle ink and paper texture; palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. One full-body cute eerie living ink stain monster with white eyes, centered large. Meaning must be immediately obvious from large clear action and objects. Subject: wearing a large blank price tag around its neck, a blank gauge dial on its belly and a small coin scale beside it, no numerals or markings. Background must be perfectly flat solid pure green #00ff00, no floor, cast shadows, gradient or pattern; no green on creature or objects. No writing, letters, numbers, marks or symbols. No known copyrighted characters.

## 単語の絵：c1-027

new

Create one square game illustration matching the attached ink monster references exactly: paper and letterpress woodblock print, thick navy outlines, flat color blocks with subtle ink and paper texture; palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. One full-body cute eerie living ink stain monster with white eyes, centered large. Meaning must be immediately obvious from large clear action and objects. Subject: freshly hatched from a cracked eggshell, shiny with a few eggshell pieces on its head. Background must be perfectly flat solid pure green #00ff00, no floor, cast shadows, gradient or pattern; no green on creature or objects. No writing, letters, numbers, marks or symbols. No known copyrighted characters.

## 単語の絵：c1-028

old

Create one square game illustration matching the attached ink monster references exactly: paper and letterpress woodblock print, thick navy outlines, flat color blocks with subtle ink and paper texture; palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. One full-body cute eerie living ink stain monster with white eyes, centered large. Meaning must be immediately obvious from large clear action and objects. Subject: hunched over with a long beard and cane, cracked and faded edges. Background must be perfectly flat solid pure green #00ff00, no floor, cast shadows, gradient or pattern; no green on creature or objects. No writing, letters, numbers, marks or symbols. No known copyrighted characters.

## 単語の絵：c1-029

young

Create one square game illustration matching the attached ink monster references exactly: paper and letterpress woodblock print, thick navy outlines, flat color blocks with subtle ink and paper texture; palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. One full-body cute eerie living ink stain monster with white eyes, centered large. Meaning must be immediately obvious from large clear action and objects. Subject: small bouncy baby creature with a round pacifier in its mouth and a sprout on its head. Background must be perfectly flat solid pure green #00ff00, no floor, cast shadows, gradient or pattern; no green on creature or objects. No writing, letters, numbers, marks or symbols. No known copyrighted characters.

## 単語の絵：c1-030

good/great

Create one square game illustration matching the attached ink monster references exactly: paper and letterpress woodblock print, thick navy outlines, flat color blocks with subtle ink and paper texture; palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. One full-body cute eerie living ink stain monster with white eyes, centered large. Meaning must be immediately obvious from large clear action and objects. Subject: giving a very large thumbs up and wearing a golden crown, surrounded by small glints. Background must be perfectly flat solid pure green #00ff00, no floor, cast shadows, gradient or pattern; no green on creature or objects. No writing, letters, numbers, marks or symbols. No known copyrighted characters.

## 単語の絵：c1-092

feel

Create one square game illustration matching the attached ink monster references exactly: paper and letterpress woodblock print, thick navy outlines, flat color blocks with subtle ink and paper texture; palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. One full-body cute eerie living ink stain monster with white eyes, centered large. Meaning must be immediately obvious from large clear action and objects. Subject: both hands pressed to its chest over a glowing heart, eyes closed, emotion radiating as soft rays. Background must be perfectly flat solid pure green #00ff00, no floor, cast shadows, gradient or pattern; no green on creature or objects. No writing, letters, numbers, marks or symbols. No known copyrighted characters.


## 単語の絵（描き直し）：c1-013

Use the three attached illustrations as exact style references for a cohesive game enemy illustration: paper and letterpress ink print, thick navy outlines, flat limited color blocks, textured paper and ink, a cute spooky ink-stain monster with white eyes. Main palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, small vermilion #c8462f. Square 1:1, one central full-body ink monster, large clear readable everyday scene. Solid perfectly flat pure green #00ff00 background only, no ground, shadows or pattern. No green in subjects. No letters, numbers, symbols, arrows or writing. Avoid known copyrighted characters. COME: the ink monster runs toward the viewer with arms outstretched, approaching a large beckoning hand entering from the foreground; clear physical approach.

## 単語の絵（描き直し）：c1-015

Use the three attached illustrations as exact style references for a cohesive game enemy illustration: paper and letterpress ink print, thick navy outlines, flat limited color blocks, textured paper and ink, a cute spooky ink-stain monster with white eyes. Main palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, small vermilion #c8462f. Square 1:1, one central full-body ink monster, large clear readable everyday scene. Solid perfectly flat pure green #00ff00 background only, no ground, shadows or pattern. No green in subjects. No letters, numbers, symbols, arrows or writing. Avoid known copyrighted characters. BECOME: the ink monster proudly puts on a large chef hat and apron and holds a mixing bowl, becoming a chef; unmistakable familiar transformation into a cook.

## 単語の絵（描き直し）：c1-017

Use the three attached illustrations as exact style references for a cohesive game enemy illustration: paper and letterpress ink print, thick navy outlines, flat limited color blocks, textured paper and ink, a cute spooky ink-stain monster with white eyes. Main palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, small vermilion #c8462f. Square 1:1, one central full-body ink monster, large clear readable everyday scene. Solid perfectly flat pure green #00ff00 background only, no ground, shadows or pattern. No green in subjects. No letters, numbers, symbols, arrows or writing. Avoid known copyrighted characters. USE: the ink monster actively uses a large paintbrush to paint a broad red stroke on a blank paper sheet; brush touching paper.

## 単語の絵（描き直し）：c1-026

Use the three attached illustrations as exact style references for a cohesive game enemy illustration: paper and letterpress ink print, thick navy outlines, flat limited color blocks, textured paper and ink, a cute spooky ink-stain monster with white eyes. Main palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, small vermilion #c8462f. Square 1:1, one central full-body ink monster, large clear readable everyday scene. Solid perfectly flat pure green #00ff00 background only, no ground, shadows or pattern. No green in subjects. No letters, numbers, symbols, arrows or writing. Avoid known copyrighted characters. PRICE: the ink monster holds a large blank price tag against a single prominent coin, as if paying for an apple at a simple shop counter. No markings on tag or coin.

## 単語の絵（描き直し）：c1-038

Use the three attached illustrations as exact style references for a cohesive game enemy illustration: paper and letterpress ink print, thick navy outlines, flat limited color blocks, textured paper and ink, a cute spooky ink-stain monster with white eyes. Main palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, small vermilion #c8462f. Square 1:1, one central full-body ink monster, large clear readable everyday scene. Solid perfectly flat pure green #00ff00 background only, no ground, shadows or pattern. No green in subjects. No letters, numbers, symbols, arrows or writing. Avoid known copyrighted characters. PERSON: the ink monster shaped unmistakably like a person with head, two arms and two legs, dressed in plain everyday shirt and trousers, standing upright.

## 単語の絵（描き直し）：c1-048

Use the three attached illustrations as exact style references for a cohesive game enemy illustration: paper and letterpress ink print, thick navy outlines, flat limited color blocks, textured paper and ink, a cute spooky ink-stain monster with white eyes. Main palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, small vermilion #c8462f. Square 1:1, one central full-body ink monster, large clear readable everyday scene. Solid perfectly flat pure green #00ff00 background only, no ground, shadows or pattern. No green in subjects. No letters, numbers, symbols, arrows or writing. Avoid known copyrighted characters. LOCAL: the ink monster stands at its own small familiar neighborhood house, waving to a neighboring house; house and friendly inhabitant suggest home neighborhood.

## 単語の絵（描き直し）：c1-049

Use the three attached illustrations as exact style references for a cohesive game enemy illustration: paper and letterpress ink print, thick navy outlines, flat limited color blocks, textured paper and ink, a cute spooky ink-stain monster with white eyes. Main palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, small vermilion #c8462f. Square 1:1, one central full-body ink monster, large clear readable everyday scene. Solid perfectly flat pure green #00ff00 background only, no ground, shadows or pattern. No green in subjects. No letters, numbers, symbols, arrows or writing. Avoid known copyrighted characters. STATE: the ink monster sits in bed visibly sick, with thermometer in mouth, ice pack on head and blanket; its present condition is unmistakable.

## 単語の絵（描き直し）：c1-051

Use the three attached illustrations as exact style references for a cohesive game enemy illustration: paper and letterpress ink print, thick navy outlines, flat limited color blocks, textured paper and ink, a cute spooky ink-stain monster with white eyes. Main palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, small vermilion #c8462f. Square 1:1, one central full-body ink monster, large clear readable everyday scene. Solid perfectly flat pure green #00ff00 background only, no ground, shadows or pattern. No green in subjects. No letters, numbers, symbols, arrows or writing. Avoid known copyrighted characters. LINE: the central ink monster stands in a clear queue behind two smaller simple paper parcels, all in a straight line toward a counter; visual focus on the row.

## 単語の絵（描き直し）：c1-052

Use the three attached illustrations as exact style references for a cohesive game enemy illustration: paper and letterpress ink print, thick navy outlines, flat limited color blocks, textured paper and ink, a cute spooky ink-stain monster with white eyes. Main palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, small vermilion #c8462f. Square 1:1, one central full-body ink monster, large clear readable everyday scene. Solid perfectly flat pure green #00ff00 background only, no ground, shadows or pattern. No green in subjects. No letters, numbers, symbols, arrows or writing. Avoid known copyrighted characters. SIDE: the ink monster stands directly beside a large simple house, touching its side wall; clear spatial relation beside.

## 単語の絵（描き直し）：c1-053

Use the three attached illustrations as exact style references for a cohesive game enemy illustration: paper and letterpress ink print, thick navy outlines, flat limited color blocks, textured paper and ink, a cute spooky ink-stain monster with white eyes. Main palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, small vermilion #c8462f. Square 1:1, one central full-body ink monster, large clear readable everyday scene. Solid perfectly flat pure green #00ff00 background only, no ground, shadows or pattern. No green in subjects. No letters, numbers, symbols, arrows or writing. Avoid known copyrighted characters. BACK: the ink monster faces completely away from viewer, showing its back with a large backpack and back of head, no face visible.

## 単語の絵（描き直し）：c1-056

Use the three attached illustrations as exact style references for a cohesive game enemy illustration: paper and letterpress ink print, thick navy outlines, flat limited color blocks, textured paper and ink, a cute spooky ink-stain monster with white eyes. Main palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, small vermilion #c8462f. Square 1:1, one central full-body ink monster, large clear readable everyday scene. Solid perfectly flat pure green #00ff00 background only, no ground, shadows or pattern. No green in subjects. No letters, numbers, symbols, arrows or writing. Avoid known copyrighted characters. REASON: the ink monster is soaked by a large rain cloud raining directly onto it, holding a closed umbrella; clear cause and effect.

## 単語の絵（描き直し）：c1-059

Use the three attached illustrations as exact style references for a cohesive game enemy illustration: paper and letterpress ink print, thick navy outlines, flat limited color blocks, textured paper and ink, a cute spooky ink-stain monster with white eyes. Main palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, small vermilion #c8462f. Square 1:1, one central full-body ink monster, large clear readable everyday scene. Solid perfectly flat pure green #00ff00 background only, no ground, shadows or pattern. No green in subjects. No letters, numbers, symbols, arrows or writing. Avoid known copyrighted characters. CHANGE: the ink monster changes clothes, pulling off a plain coat while putting on a distinctly different apron; obvious everyday act of changing.

## 単語の絵（描き直し）：c1-064

Use the three attached illustrations as exact style references for a cohesive game enemy illustration: paper and letterpress ink print, thick navy outlines, flat limited color blocks, textured paper and ink, a cute spooky ink-stain monster with white eyes. Main palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, small vermilion #c8462f. Square 1:1, one central full-body ink monster, large clear readable everyday scene. Solid perfectly flat pure green #00ff00 background only, no ground, shadows or pattern. No green in subjects. No letters, numbers, symbols, arrows or writing. Avoid known copyrighted characters. WHOLE: the ink monster embraces one large complete round uncut cake with frosting, no missing slices; cake is the dominant visible object.


## 単語の絵（描き直し）：c1-065

Square game illustration. Match attached reference images exactly: paper and letterpress ink print, thick navy outlines, flat color blocks, textured paper and ink stains, cute eerie living ink blot monster with white eyes. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, little vermilion #c8462f. Monster centered large, full body. Meaning unmistakable. Entire background pure flat green #00ff00, no shadow, ground, gradient or pattern; no green in subjects. No letters, numbers, symbols, speech bubbles, logos, or copyrighted characters. Two identical ink monster twins, same face, shape and pose, holding identical apples.

## 単語の絵（描き直し）：c1-066

Square game illustration. Match attached reference images exactly: paper and letterpress ink print, thick navy outlines, flat color blocks, textured paper and ink stains, cute eerie living ink blot monster with white eyes. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, little vermilion #c8462f. Monster centered large, full body. Meaning unmistakable. Entire background pure flat green #00ff00, no shadow, ground, gradient or pattern; no green in subjects. No letters, numbers, symbols, speech bubbles, logos, or copyrighted characters. Monster sorts three different kinds of fruit: a large apple, pear and grapes, each in a separate basket.

## 単語の絵（描き直し）：c1-068

Square game illustration. Match attached reference images exactly: paper and letterpress ink print, thick navy outlines, flat color blocks, textured paper and ink stains, cute eerie living ink blot monster with white eyes. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, little vermilion #c8462f. Monster centered large, full body. Meaning unmistakable. Entire background pure flat green #00ff00, no shadow, ground, gradient or pattern; no green in subjects. No letters, numbers, symbols, speech bubbles, logos, or copyrighted characters. Monster successfully reaches a high shelf by standing on a small stool and grasps a large jar, pleased it can reach.

## 単語の絵（描き直し）：c1-070

Square game illustration. Match attached reference images exactly: paper and letterpress ink print, thick navy outlines, flat color blocks, textured paper and ink stains, cute eerie living ink blot monster with white eyes. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, little vermilion #c8462f. Monster centered large, full body. Meaning unmistakable. Entire background pure flat green #00ff00, no shadow, ground, gradient or pattern; no green in subjects. No letters, numbers, symbols, speech bubbles, logos, or copyrighted characters. Monster closes the last page of a large picture book, showing the story has ended; blank book.

## 単語の絵（描き直し）：c1-076

Square game illustration. Match attached reference images exactly: paper and letterpress ink print, thick navy outlines, flat color blocks, textured paper and ink stains, cute eerie living ink blot monster with white eyes. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, little vermilion #c8462f. Monster centered large, full body. Meaning unmistakable. Entire background pure flat green #00ff00, no shadow, ground, gradient or pattern; no green in subjects. No letters, numbers, symbols, speech bubbles, logos, or copyrighted characters. Monster runs a shop, handing a large loaf across a shop counter to a customer's hand and accepting coins with its other hand.

## 単語の絵（描き直し）：c1-077

Square game illustration. Match attached reference images exactly: paper and letterpress ink print, thick navy outlines, flat color blocks, textured paper and ink stains, cute eerie living ink blot monster with white eyes. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, little vermilion #c8462f. Monster centered large, full body. Meaning unmistakable. Entire background pure flat green #00ff00, no shadow, ground, gradient or pattern; no green in subjects. No letters, numbers, symbols, speech bubbles, logos, or copyrighted characters. Monster proudly holds a fully grown flowering plant in a pot beside a seed packet with a seed pictogram and a watering can, the result of growing.

## 単語の絵（描き直し）：c1-082

Square game illustration. Match attached reference images exactly: paper and letterpress ink print, thick navy outlines, flat color blocks, textured paper and ink stains, cute eerie living ink blot monster with white eyes. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, little vermilion #c8462f. Monster centered large, full body. Meaning unmistakable. Entire background pure flat green #00ff00, no shadow, ground, gradient or pattern; no green in subjects. No letters, numbers, symbols, speech bubbles, logos, or copyrighted characters. Monster receives a large wrapped gift from another person's hands and bows deeply in gratitude, joyful eyes.

## 単語の絵（描き直し）：c1-083

Square game illustration. Match attached reference images exactly: paper and letterpress ink print, thick navy outlines, flat color blocks, textured paper and ink stains, cute eerie living ink blot monster with white eyes. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, little vermilion #c8462f. Monster centered large, full body. Meaning unmistakable. Entire background pure flat green #00ff00, no shadow, ground, gradient or pattern; no green in subjects. No letters, numbers, symbols, speech bubbles, logos, or copyrighted characters. Monster stands its ground facing a huge broken bridge blocking its way, hands on hips in determination, confronting the obstacle.

## 単語の絵（描き直し）：c1-084

Square game illustration. Match attached reference images exactly: paper and letterpress ink print, thick navy outlines, flat color blocks, textured paper and ink stains, cute eerie living ink blot monster with white eyes. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, little vermilion #c8462f. Monster centered large, full body. Meaning unmistakable. Entire background pure flat green #00ff00, no shadow, ground, gradient or pattern; no green in subjects. No letters, numbers, symbols, speech bubbles, logos, or copyrighted characters. Monster points with both hands to its own huge rounded head above a much smaller body; eyes on head.

## 単語の絵（描き直し）：c1-085

Square game illustration. Match attached reference images exactly: paper and letterpress ink print, thick navy outlines, flat color blocks, textured paper and ink stains, cute eerie living ink blot monster with white eyes. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, little vermilion #c8462f. Monster centered large, full body. Meaning unmistakable. Entire background pure flat green #00ff00, no shadow, ground, gradient or pattern; no green in subjects. No letters, numbers, symbols, speech bubbles, logos, or copyrighted characters. Monster holds an enormous clear open five-fingered hand toward viewer, palm forward, its full little body visible behind.

## 単語の絵（描き直し）：c1-090

Square game illustration. Match attached reference images exactly: paper and letterpress ink print, thick navy outlines, flat color blocks, textured paper and ink stains, cute eerie living ink blot monster with white eyes. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, little vermilion #c8462f. Monster centered large, full body. Meaning unmistakable. Entire background pure flat green #00ff00, no shadow, ground, gradient or pattern; no green in subjects. No letters, numbers, symbols, speech bubbles, logos, or copyrighted characters. Monster holds a huge blank paper form on a clipboard and pen poised to fill it in; empty outlined rectangular fields only.

## 単語の絵（描き直し）：c1-092

Square game illustration. Match attached reference images exactly: paper and letterpress ink print, thick navy outlines, flat color blocks, textured paper and ink stains, cute eerie living ink blot monster with white eyes. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, little vermilion #c8462f. Monster centered large, full body. Meaning unmistakable. Entire background pure flat green #00ff00, no shadow, ground, gradient or pattern; no green in subjects. No letters, numbers, symbols, speech bubbles, logos, or copyrighted characters. Monster touches a large prickly cactus with its fingertip and recoils with a startled expression, clearly feeling the prick.


## 単語の絵：c2-087
戦術：紙魚が兵隊の駒と旗を並べた大きな地図を見て作戦を練る。添付の参考画像に合わせた紙と活版インクの版画風、太い紺線、紺・霧・紙色と少量の朱、白い目。中央に全身、正方形、背景は均一な純緑 #00ff00。文字・数字・記号なし。

## 単語の絵：c2-130

高速道路：車やトラックが行き交う複数車線の道路のそばに立つ。 添付の紙と活版インクの版画風。白い目、太い紺の線、紺・霧・紙色と少量の朱の平塗り。正方形、中央に全身、背景は影や模様のない純緑 #00ff00。文字・数字・記号なし。

## 単語の絵：c2-131

回答者・アンケート：鉛筆で質問票の枠に回答する。 添付の紙と活版インクの版画風。白い目、太い紺の線、紺・霧・紙色と少量の朱の平塗り。正方形、中央に全身、背景は影や模様のない純緑 #00ff00。文字・数字・記号なし。

## 単語の絵：c2-132

宝飾品：ネックレス、指輪、イヤリングを身に着ける。 添付の紙と活版インクの版画風。白い目、太い紺の線、紺・霧・紙色と少量の朱の平塗り。正方形、中央に全身、背景は影や模様のない純緑 #00ff00。文字・数字・記号なし。

## 単語の絵：c2-133

残業：月の見える夜、疲れながら机で働く。 添付の紙と活版インクの版画風。白い目、太い紺の線、紺・霧・紙色と少量の朱の平塗り。正方形、中央に全身、背景は影や模様のない純緑 #00ff00。文字・数字・記号なし。

## 単語の絵：c2-134

一晩の：月と星の見えるホテルのベッドで眠る。 添付の紙と活版インクの版画風。白い目、太い紺の線、紺・霧・紙色と少量の朱の平塗り。正方形、中央に全身、背景は影や模様のない純緑 #00ff00。文字・数字・記号なし。

## 単語の絵：c2-135

傑出した：他より高い表彰台でスポットライトを浴びる。 添付の紙と活版インクの版画風。白い目、太い紺の線、紺・霧・紙色と少量の朱の平塗り。正方形、中央に全身、背景は影や模様のない純緑 #00ff00。文字・数字・記号なし。

## 単語の絵：c2-136

ざっと読む：本のページを素早くめくり目を走らせる。 添付の紙と活版インクの版画風。白い目、太い紺の線、紺・霧・紙色と少量の朱の平塗り。正方形、中央に全身、背景は影や模様のない純緑 #00ff00。文字・数字・記号なし。

## 単語の絵：c2-137

影響：ドミノの一つを倒して連鎖を起こす。 添付の紙と活版インクの版画風。白い目、太い紺の線、紺・霧・紙色と少量の朱の平塗り。正方形、中央に全身、背景は影や模様のない純緑 #00ff00。文字・数字・記号なし。

## 単語の絵：c2-138

革新的な：新しい装置を発明し電球が光る。 添付の紙と活版インクの版画風。白い目、太い紺の線、紺・霧・紙色と少量の朱の平塗り。正方形、中央に全身、背景は影や模様のない純緑 #00ff00。文字・数字・記号なし。

## 単語の絵：c2-139

ロゴ：旗と箱に同じシンプルな図案。 添付の紙と活版インクの版画風。白い目、太い紺の線、紺・霧・紙色と少量の朱の平塗り。正方形、中央に全身、背景は影や模様のない純緑 #00ff00。文字・数字・記号なし。

## 単語の絵：c2-140

写真家：大きなカメラで友人を撮影する。 添付の紙と活版インクの版画風。白い目、太い紺の線、紺・霧・紙色と少量の朱の平塗り。正方形、中央に全身、背景は影や模様のない純緑 #00ff00。文字・数字・記号なし。

## 単語の絵：c2-141

側面：立方体を回して別の面を見る。 添付の紙と活版インクの版画風。白い目、太い紺の線、紺・霧・紙色と少量の朱の平塗り。正方形、中央に全身、背景は影や模様のない純緑 #00ff00。文字・数字・記号なし。

## 単語の絵：c2-142

ダウンロードする：雲から箱がコンピューターに降りる。 添付の紙と活版インクの版画風。白い目、太い紺の線、紺・霧・紙色と少量の朱の平塗り。正方形、中央に全身、背景は影や模様のない純緑 #00ff00。文字・数字・記号なし。

## 単語の絵：c2-143

パスワード：鍵のかかったドアの入力装置に秘密を入力する。 添付の紙と活版インクの版画風。白い目、太い紺の線、紺・霧・紙色と少量の朱の平塗り。正方形、中央に全身、背景は影や模様のない純緑 #00ff00。文字・数字・記号なし。

## 単語の絵：c2-144

禁止する：入り口で係員が手を上げて通せんぼする。 添付の紙と活版インクの版画風。白い目、太い紺の線、紺・霧・紙色と少量の朱の平塗り。正方形、中央に全身、背景は影や模様のない純緑 #00ff00。文字・数字・記号なし。

## 単語の絵：c2-145

平日：通勤かばんを持ち、五日分のカレンダーと会社へ向かう。 添付の紙と活版インクの版画風。白い目、太い紺の線、紺・霧・紙色と少量の朱の平塗り。正方形、中央に全身、背景は影や模様のない純緑 #00ff00。文字・数字・記号なし。

## 単語の絵：c2-146

賞与：上司から硬貨の入った追加の袋を受け取る。 添付の紙と活版インクの版画風。白い目、太い紺の線、紺・霧・紙色と少量の朱の平塗り。正方形、中央に全身、背景は影や模様のない純緑 #00ff00。文字・数字・記号なし。

## 単語の絵：c2-147

インク：羽ペンをインク壺につける。 添付の紙と活版インクの版画風。白い目、太い紺の線、紺・霧・紙色と少量の朱の平塗り。正方形、中央に全身、背景は影や模様のない純緑 #00ff00。文字・数字・記号なし。

## 単語の絵：c2-148

清掃員：モップとバケツで床を掃除する。 添付の紙と活版インクの版画風。白い目、太い紺の線、紺・霧・紙色と少量の朱の平塗り。正方形、中央に全身、背景は影や模様のない純緑 #00ff00。文字・数字・記号なし。

## 単語の絵：c2-149

本社を置く：小さな支店に囲まれた大きな本社ビル。 添付の紙と活版インクの版画風。白い目、太い紺の線、紺・霧・紙色と少量の朱の平塗り。正方形、中央に全身、背景は影や模様のない純緑 #00ff00。文字・数字・記号なし。

## 単語の絵：c2-150

文房具：鉛筆、はさみ、テープ、ノートに囲まれる。 添付の紙と活版インクの版画風。白い目、太い紺の線、紺・霧・紙色と少量の朱の平塗り。正方形、中央に全身、背景は影や模様のない純緑 #00ff00。文字・数字・記号なし。

## 単語の絵：c2-151

承認する：書類に大きな印を押す。 添付の紙と活版インクの版画風。白い目、太い紺の線、紺・霧・紙色と少量の朱の平塗り。正方形、中央に全身、背景は影や模様のない純緑 #00ff00。文字・数字・記号なし。

## 単語の絵：c2-152

当局：制服の係員が人々を誘導する。 添付の紙と活版インクの版画風。白い目、太い紺の線、紺・霧・紙色と少量の朱の平塗り。正方形、中央に全身、背景は影や模様のない純緑 #00ff00。文字・数字・記号なし。

## 単語の絵：c2-153

一般に：皆と同じように傘を差す。 添付の紙と活版インクの版画風。白い目、太い紺の線、紺・霧・紙色と少量の朱の平塗り。正方形、中央に全身、背景は影や模様のない純緑 #00ff00。文字・数字・記号なし。

## 単語の絵：c2-154

収容する：たくさんの客をベッドの並ぶ部屋へ迎える。 添付の紙と活版インクの版画風。白い目、太い紺の線、紺・霧・紙色と少量の朱の平塗り。正方形、中央に全身、背景は影や模様のない純緑 #00ff00。文字・数字・記号なし。

## 単語の絵：c2-155

いらだたせる：小さな虫に付きまとわれ、いら立つ。 添付の紙と活版インクの版画風。白い目、太い紺の線、紺・霧・紙色と少量の朱の平塗り。正方形、中央に全身、背景は影や模様のない純緑 #00ff00。文字・数字・記号なし。

## 単語の絵：c2-156

調整する：指揮者として演奏者をまとめる。 添付の紙と活版インクの版画風。白い目、太い紺の線、紺・霧・紙色と少量の朱の平塗り。正方形、中央に全身、背景は影や模様のない純緑 #00ff00。文字・数字・記号なし。

## 単語の絵：c2-157

やめる：道具を置いて職場のドアから出る。 添付の紙と活版インクの版画風。白い目、太い紺の線、紺・霧・紙色と少量の朱の平塗り。正方形、中央に全身、背景は影や模様のない純緑 #00ff00。文字・数字・記号なし。

## 単語の絵：c2-158

機長：帽子と制服を着て飛行機の操縦席に座る。 添付の紙と活版インクの版画風。白い目、太い紺の線、紺・霧・紙色と少量の朱の平塗り。正方形、中央に全身、背景は影や模様のない純緑 #00ff00。文字・数字・記号なし。

## 単語の絵：c2-159

設置：レンチとボルトで大きな機械を据え付ける。 添付の紙と活版インクの版画風。白い目、太い紺の線、紺・霧・紙色と少量の朱の平塗り。正方形、中央に全身、背景は影や模様のない純緑 #00ff00。文字・数字・記号なし。

## 単語の絵：c2-160

空き状況：ホテルの受付で空室の鍵を見せる。 添付の紙と活版インクの版画風。白い目、太い紺の線、紺・霧・紙色と少量の朱の平塗り。正方形、中央に全身、背景は影や模様のない純緑 #00ff00。文字・数字・記号なし。

## 単語の絵：c2-161

無料の：代金を払わず贈り物を受け取る。 添付の紙と活版インクの版画風。白い目、太い紺の線、紺・霧・紙色と少量の朱の平塗り。正方形、中央に全身、背景は影や模様のない純緑 #00ff00。文字・数字・記号なし。

## 単語の絵：c2-162

値上げ：大きな値札がはしごを上り驚く。 添付の紙と活版インクの版画風。白い目、太い紺の線、紺・霧・紙色と少量の朱の平塗り。正方形、中央に全身、背景は影や模様のない純緑 #00ff00。文字・数字・記号なし。

## 単語の絵：c2-163

生産性：生産ラインで多くの箱を作る。 添付の紙と活版インクの版画風。白い目、太い紺の線、紺・霧・紙色と少量の朱の平塗り。正方形、中央に全身、背景は影や模様のない純緑 #00ff00。文字・数字・記号なし。

## 単語の絵：c2-164

移転する：引っ越し車と箱を運び別の家へ移る。 添付の紙と活版インクの版画風。白い目、太い紺の線、紺・霧・紙色と少量の朱の平塗り。正方形、中央に全身、背景は影や模様のない純緑 #00ff00。文字・数字・記号なし。

## 単語の絵：c2-165

不満な：口をへの字にして腕を組む。 添付の紙と活版インクの版画風。白い目、太い紺の線、紺・霧・紙色と少量の朱の平塗り。正方形、中央に全身、背景は影や模様のない純緑 #00ff00。文字・数字・記号なし。

## 単語の絵：c2-166

不完全な：一片が欠けたジグソーパズルを持つ。 添付の紙と活版インクの版画風。白い目、太い紺の線、紺・霧・紙色と少量の朱の平塗り。正方形、中央に全身、背景は影や模様のない純緑 #00ff00。文字・数字・記号なし。

## 単語の絵：c2-167

非現実的な：眠りながら空飛ぶドラゴンを夢見る。 添付の紙と活版インクの版画風。白い目、太い紺の線、紺・霧・紙色と少量の朱の平塗り。正方形、中央に全身、背景は影や模様のない純緑 #00ff00。文字・数字・記号なし。

## 単語の絵：c2-168

埠頭：船がロープで係留された木の桟橋に立つ。 添付の紙と活版インクの版画風。白い目、太い紺の線、紺・霧・紙色と少量の朱の平塗り。正方形、中央に全身、背景は影や模様のない純緑 #00ff00。文字・数字・記号なし。

## 単語の絵：c2-169

機械類：歯車やパイプを備えた工場の機械に囲まれる。 添付の紙と活版インクの版画風。白い目、太い紺の線、紺・霧・紙色と少量の朱の平塗り。正方形、中央に全身、背景は影や模様のない純緑 #00ff00。文字・数字・記号なし。

## 単語の絵：c2-170

飛行機：雲の上を飛ぶ大きな旅客機を操縦する。 添付の紙と活版インクの版画風。白い目、太い紺の線、紺・霧・紙色と少量の朱の平塗り。正方形、中央に全身、背景は影や模様のない純緑 #00ff00。文字・数字・記号なし。

## 単語の絵：c2-002

Square game enemy illustration. Match the three attached reference images: paper and letterpress ink print, thick navy outlines, flat color blocks, paper texture, cute spooky living ink stain monster with white eyes. Full-body main monster centered and large, with oversized clear everyday objects and action conveying meaning. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, little vermilion #c8462f. Background perfectly flat pure green #00ff00 only, no ground, shadows or patterns, no green on subject. No letters, numbers, symbols, text or recognizable characters. Scene: relaxing on a deck chair on a large cruise ship, sunglasses and a drink

## 単語の絵：c2-001

Square game enemy illustration. Match the three attached reference images: paper and letterpress ink print, thick navy outlines, flat color blocks, paper texture, cute spooky living ink stain monster with white eyes. Full-body main monster centered and large, with oversized clear everyday objects and action conveying meaning. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, little vermilion #c8462f. Background perfectly flat pure green #00ff00 only, no ground, shadows or patterns, no green on subject. No letters, numbers, symbols, text or recognizable characters. Scene: a polite gentleman bowing and tipping a top hat, wearing a bow tie

## 単語の絵：c2-004

Square game enemy illustration. Match the three attached reference images: paper and letterpress ink print, thick navy outlines, flat color blocks, paper texture, cute spooky living ink stain monster with white eyes. Full-body main monster centered and large, with oversized clear everyday objects and action conveying meaning. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, little vermilion #c8462f. Background perfectly flat pure green #00ff00 only, no ground, shadows or patterns, no green on subject. No letters, numbers, symbols, text or recognizable characters. Scene: reading an electronic book on a thin tablet, a page without writing

## 単語の絵：c2-007

Square game enemy illustration. Match the three attached reference images: paper and letterpress ink print, thick navy outlines, flat color blocks, paper texture, cute spooky living ink stain monster with white eyes. Full-body main monster centered and large, with oversized clear everyday objects and action conveying meaning. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, little vermilion #c8462f. Background perfectly flat pure green #00ff00 only, no ground, shadows or patterns, no green on subject. No letters, numbers, symbols, text or recognizable characters. Scene: booking a restaurant table at a host stand with a blank reservation book

## 単語の絵：c2-008

Square game enemy illustration. Match the three attached reference images: paper and letterpress ink print, thick navy outlines, flat color blocks, paper texture, cute spooky living ink stain monster with white eyes. Full-body main monster centered and large, with oversized clear everyday objects and action conveying meaning. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, little vermilion #c8462f. Background perfectly flat pure green #00ff00 only, no ground, shadows or patterns, no green on subject. No letters, numbers, symbols, text or recognizable characters. Scene: working out a logical inference by connecting visual clues on a board

## 単語の絵：c2-003

Square game enemy illustration. Match the three attached reference images: paper and letterpress ink print, thick navy outlines, flat color blocks, paper texture, cute spooky living ink stain monster with white eyes. Full-body main monster centered and large, with oversized clear everyday objects and action conveying meaning. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, little vermilion #c8462f. Background perfectly flat pure green #00ff00 only, no ground, shadows or patterns, no green on subject. No letters, numbers, symbols, text or recognizable characters. Scene: a shopper carrying many shopping bags leaving a store

## 単語の絵：c2-005

Square game enemy illustration. Match the three attached reference images: paper and letterpress ink print, thick navy outlines, flat color blocks, paper texture, cute spooky living ink stain monster with white eyes. Full-body main monster centered and large, with oversized clear everyday objects and action conveying meaning. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, little vermilion #c8462f. Background perfectly flat pure green #00ff00 only, no ground, shadows or patterns, no green on subject. No letters, numbers, symbols, text or recognizable characters. Scene: with suitcase in an airport terminal with windows showing airplanes

## 単語の絵：c2-009

Square game enemy illustration. Match the three attached reference images: paper and letterpress ink print, thick navy outlines, flat color blocks, paper texture, cute spooky living ink stain monster with white eyes. Full-body main monster centered and large, with oversized clear everyday objects and action conveying meaning. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, little vermilion #c8462f. Background perfectly flat pure green #00ff00 only, no ground, shadows or patterns, no green on subject. No letters, numbers, symbols, text or recognizable characters. Scene: discovering a large footprint clue with a magnifying glass

## 単語の絵：c2-012
宛名の消えた封筒の一つ目の魔物が、3時を示す大きな文字のないアナログ時計を持つ。全身、紙と活版インクの版画風、太い紺線、紺・霧・紙色と少量の朱、背景は純緑一色。文字・数字なし。

## 単語の絵：c2-010
参照：nijimi.png（キャラクター）、c1-051.png（画風）。水でにじんだ白い目の魔物が、受話器付きのファックスに紙を入れ、別の紙が出てくる。紙と活版インクの版画風、太い紺の線、平塗り、紙の質感。紺・霧・紙色と少量の朱。正方形、全身、背景は純緑 #00ff00、文字・数字・記号なし。

## 単語の絵：c2-017
Use case illustration-story, square game asset. Image 1 is exact character reference: preserve envelope body, flap, one sad eye, thin limbs and ink stains. Image 2 is style reference. One central full-body envelope monster, large and recognizable. Paper letterpress print, thick navy outlines, flat navy #1f2a44, mist #9fb3bf, paper #f3ead8 and little vermilion #c8462f, white eye, paper texture. Background absolutely flat solid pure green #00ff00 without ground, shadow or pattern; no green inside subject. No letters, numbers, symbols or speech bubbles. Meaning must be visually clear. Depict character looking back at several recently torn calendar pages. 

## 単語の絵：c2-022
Use case illustration-story, square game asset. Image 1 is exact character reference: preserve envelope body, flap, one sad eye, thin limbs and ink stains. Image 2 is style reference. One central full-body envelope monster, large and recognizable. Paper letterpress print, thick navy outlines, flat navy #1f2a44, mist #9fb3bf, paper #f3ead8 and little vermilion #c8462f, white eye, paper texture. Background absolutely flat solid pure green #00ff00 without ground, shadow or pattern; no green inside subject. No letters, numbers, symbols or speech bubbles. Meaning must be visually clear. Depict character returning coins to a customer who returns a product box at a counter. 

共通指示：参照の消しゴムのかすが固まった灰色のころころした魔物の体形・白い目・特徴を保つ。紙と活版インクの版画風、太い紺線、紺・霧色・紙色を主体に朱を少し、塊ごとの平塗り。正方形、全身を中央に大きく。背景は影や模様のない純緑 #00ff00。体内に緑を使わず、文字・数字・記号を入れない。意味を動作と持ち物で大きく明瞭に表す。

## 単語の絵：c2-006
事務書類・事務の・メモ：机の書類の山に判を押し、無地の付箋を添える。

## 単語の絵：c2-014
真夜中：満月と星の下、眠る町を背にあくびする。

## 単語の絵：c2-019
顧問：机越しに悩む相手へ助言する。

## 単語の絵：c2-024
在庫・倉庫：倉庫で積み上がった箱を数える。

## 単語の絵：c2-029
請求書・領収書：カウンターで硬貨と長い無地の紙をやり取りする。

## 単語の絵：c2-034
ロビー・ソファー：入口の広間にある大きなソファーでくつろぐ。

## 単語の絵：c2-039
布・セーター：編んだセーターを着て布の反物を持つ。

## 単語の絵：c2-044
地下鉄・シャトルバス：地下トンネルの電車に乗り、地上には小さなバス。

## 単語の絵：c2-049
保証：新しい機器を大きな盾で守り、修理人が工具を持つ。

## 単語の絵：c2-054
エレベーター：高い建物の断面で、開いたエレベーターに立つ。

## 単語の絵：c2-059
問い合わせる：案内カウンターで手を挙げて質問する。

## 単語の絵：c2-064
マニュアル・説明の：説明書を読みながら簡単な機械の組立を説明する。

## 単語の絵：c2-069
屋内の：屋根と壁、敷物とカーテンが見える家の中でくつろぐ。

## 単語の絵：c2-074
傘・雨の：雨雲の下で大きく開いた傘を持つ。

## 単語の絵：c2-079
小型の・ミニ：指先につまんだ小さなカメラを大きなカメラと比べる。

## 単語の絵：c2-084
クーポン・お買い得品・手頃な：店で無地の切り抜き券を出し、少ない硬貨で商品を買う。

## 単語の絵：c2-090
交換品・更新する：壊れた部品を同じ形の新品と交換する。

## 単語の絵：c2-095
容器：中身の見える大きな箱のふたを開ける。

## 単語の絵：c2-100
スーパー・モール：食品棚の横で食料入りのカートを押す。

## 単語の絵：c2-105
出席者：講演者に向かって観客席に座る。

## 単語の絵：c2-110
サッカー・野球：サッカーボールをゴールへ蹴り、野球のバットとボールを持つ。

## 単語の絵：c2-115
カレンダー：文字も数字もない格子の壁掛けカレンダーをめくる。

## 単語の絵：c2-120
おいしい・風味：湯気の上がる料理を喜んで食べる。

## 単語の絵：c2-125
書き直す：紙を消しゴムで消して鉛筆で書き直し、丸めた紙を添える。

## 単語の絵：c2-146
賞与：笑顔の上司から追加の硬貨の袋を受け取る。

## 単語の絵：c2-151
承認する：無地の書類に大きな判を押す。

## 単語の絵：c2-156
調整する：指揮棒を振り、作業する仲間をまとめる。

## 単語の絵：c2-161
無料の：カウンターで笑顔の店員からリボン付きの贈り物を受け取る。硬貨は描かない。

## 単語の絵：c2-166
不完全な：一片だけ欠け、穴の見える大きなジグソーパズルを持つ。

## 単語の絵：c2-015
nijimi.png の魔物が手紙を書き終え、胸に手を当てて丁寧にお辞儀する。c1-051.png の版画風、純緑背景、文字・数字・記号なし。

## 単語の絵：c2-020
nijimi.png の魔物が笛をつけ、体操を実演して生徒を指導する。c1-051.png の版画風、純緑背景、文字・数字・記号なし。

## 単語の絵：c2-027
Use case illustration-story, square game asset. Image 1 is exact character reference: preserve envelope body, flap, one sad eye, thin limbs and ink stains. Image 2 is style reference. One central full-body envelope monster, large and recognizable. Paper letterpress print, thick navy outlines, flat navy #1f2a44, mist #9fb3bf, paper #f3ead8 and little vermilion #c8462f, white eye, paper texture. Background absolutely flat solid pure green #00ff00 without ground, shadow or pattern; no green inside subject. No letters, numbers, symbols or speech bubbles. Meaning must be visually clear. Depict character walking amidst a dense cluster of tall city buildings and tiny cars. 

## 単語の絵：c2-030
nijimi.png の魔物が大きく開いた折りたたみパンフレットを読者に見せる。c1-051.png の版画風、純緑背景、文字・数字・記号なし。

## 単語の絵：c2-032
Use case illustration-story, square game asset. Image 1 is exact character reference: preserve envelope body, flap, one sad eye, thin limbs and ink stains. Image 2 is style reference. One central full-body envelope monster, large and recognizable. Paper letterpress print, thick navy outlines, flat navy #1f2a44, mist #9fb3bf, paper #f3ead8 and little vermilion #c8462f, white eye, paper texture. Background absolutely flat solid pure green #00ff00 without ground, shadow or pattern; no green inside subject. No letters, numbers, symbols or speech bubbles. Meaning must be visually clear. Depict character exchanging a box for coins with a customer. 

## 単語の絵：c2-080
nijimi.png の魔物が歯科医となり、鏡で患者の開いた口と歯を診察する。c1-051.png の版画風、純緑背景、文字・数字・記号なし。

## 単語の絵：c2-037
Use case illustration-story, square game asset. Image 1 is exact character reference: preserve envelope body, flap, one sad eye, thin limbs and ink stains. Image 2 is style reference. One central full-body envelope monster, large and recognizable. Paper letterpress print, thick navy outlines, flat navy #1f2a44, mist #9fb3bf, paper #f3ead8 and little vermilion #c8462f, white eye, paper texture. Background absolutely flat solid pure green #00ff00 without ground, shadow or pattern; no green inside subject. No letters, numbers, symbols or speech bubbles. Meaning must be visually clear. Depict character inserting two sheets together inside a separate open envelope. 

## 単語の絵：c2-047
Use case illustration-story, square game asset. Image 1 is exact character reference: preserve envelope body, flap, one sad eye, thin limbs and ink stains. Image 2 is style reference. One central full-body envelope monster, large and recognizable. Paper letterpress print, thick navy outlines, flat navy #1f2a44, mist #9fb3bf, paper #f3ead8 and little vermilion #c8462f, white eye, paper texture. Background absolutely flat solid pure green #00ff00 without ground, shadow or pattern; no green inside subject. No letters, numbers, symbols or speech bubbles. Meaning must be visually clear. Depict character a restaurant waiter carrying a tray with a plate and glass, wearing a bow tie. 

## 単語の絵：c2-091
nijimi.png の魔物がカビの生えた牛乳を持ち、空の砂時計の横にいる。c1-051.png の版画風、純緑背景、文字・数字・記号なし。

## 単語の絵：c2-042
Use case illustration-story, square game asset. Image 1 is exact character reference: preserve envelope body, flap, one sad eye, thin limbs and ink stains. Image 2 is style reference. One central full-body envelope monster, large and recognizable. Paper letterpress print, thick navy outlines, flat navy #1f2a44, mist #9fb3bf, paper #f3ead8 and little vermilion #c8462f, white eye, paper texture. Background absolutely flat solid pure green #00ff00 without ground, shadow or pattern; no green inside subject. No letters, numbers, symbols or speech bubbles. Meaning must be visually clear. Depict character commuting in a crowded train, hanging from a strap and holding a briefcase. 

## 単語の絵：c2-013

Square game illustration; reference image shimi.png is the exact character and style. Preserve the same navy ink stain monster’s silhouette, white eyes, ink droplets and features, large central full body. Paper letterpress print texture, bold navy outlines and flat limited navy #1f2a44, pale grey #9fb3bf, cream #f3ead8, little vermilion #c8462f. Make the meaning immediately obvious with large recognizable objects. Pure flat solid #00ff00 green background, no ground, shadows, scenery background, letters, numbers or symbols. Scene: holding a lunch box under a large sun directly overhead, conveying noon

## 単語の絵：c2-018

Square game illustration; reference image shimi.png is the exact character and style. Preserve the same navy ink stain monster’s silhouette, white eyes, ink droplets and features, large central full body. Paper letterpress print texture, bold navy outlines and flat limited navy #1f2a44, pale grey #9fb3bf, cream #f3ead8, little vermilion #c8462f. Make the meaning immediately obvious with large recognizable objects. Pure flat solid #00ff00 green background, no ground, shadows, scenery background, letters, numbers or symbols. Scene: a boss on a raised platform watching small busy workers, arms folded, supervising

## 単語の絵：c2-023

Square game illustration; reference image shimi.png is the exact character and style. Preserve the same navy ink stain monster’s silhouette, white eyes, ink droplets and features, large central full body. Paper letterpress print texture, bold navy outlines and flat limited navy #1f2a44, pale grey #9fb3bf, cream #f3ead8, little vermilion #c8462f. Make the meaning immediately obvious with large recognizable objects. Pure flat solid #00ff00 green background, no ground, shadows, scenery background, letters, numbers or symbols. Scene: presenting large shelves of boxes, bottles and toys for sale, merchandise

## 単語の絵：c2-028

Square game illustration; reference image shimi.png is the exact character and style. Preserve the same navy ink stain monster’s silhouette, white eyes, ink droplets and features, large central full body. Paper letterpress print texture, bold navy outlines and flat limited navy #1f2a44, pale grey #9fb3bf, cream #f3ead8, little vermilion #c8462f. Make the meaning immediately obvious with large recognizable objects. Pure flat solid #00ff00 green background, no ground, shadows, scenery background, letters, numbers or symbols. Scene: frantically working on unfinished paperwork beside a nearly empty hourglass and ringing alarm clock, deadline

## 単語の絵：c2-033

Square game illustration; reference image shimi.png is the exact character and style. Preserve the same navy ink stain monster’s silhouette, white eyes, ink droplets and features, large central full body. Paper letterpress print texture, bold navy outlines and flat limited navy #1f2a44, pale grey #9fb3bf, cream #f3ead8, little vermilion #c8462f. Make the meaning immediately obvious with large recognizable objects. Pure flat solid #00ff00 green background, no ground, shadows, scenery background, letters, numbers or symbols. Scene: wearing a uniform behind a reception counter, welcoming a guest and handing over a key

## 単語の絵：c2-038

Square game illustration; reference image shimi.png is the exact character and style. Preserve the same navy ink stain monster’s silhouette, white eyes, ink droplets and features, large central full body. Paper letterpress print texture, bold navy outlines and flat limited navy #1f2a44, pale grey #9fb3bf, cream #f3ead8, little vermilion #c8462f. Make the meaning immediately obvious with large recognizable objects. Pure flat solid #00ff00 green background, no ground, shadows, scenery background, letters, numbers or symbols. Scene: wearing goggles, fixing an open machine with gears using a large wrench and toolbox

## 単語の絵：c2-043

Square game illustration; reference image shimi.png is the exact character and style. Preserve the same navy ink stain monster’s silhouette, white eyes, ink droplets and features, large central full body. Paper letterpress print texture, bold navy outlines and flat limited navy #1f2a44, pale grey #9fb3bf, cream #f3ead8, little vermilion #c8462f. Make the meaning immediately obvious with large recognizable objects. Pure flat solid #00ff00 green background, no ground, shadows, scenery background, letters, numbers or symbols. Scene: holding a rotary telephone receiver to its ear while turning its circular dial

## 単語の絵：c2-048

Square game illustration; reference image shimi.png is the exact character and style. Preserve the same navy ink stain monster’s silhouette, white eyes, ink droplets and features, large central full body. Paper letterpress print texture, bold navy outlines and flat limited navy #1f2a44, pale grey #9fb3bf, cream #f3ead8, little vermilion #c8462f. Make the meaning immediately obvious with large recognizable objects. Pure flat solid #00ff00 green background, no ground, shadows, scenery background, letters, numbers or symbols. Scene: handing house keys to a tenant who pays coins, with an apartment house

## 単語の絵：c2-053

Square game illustration; reference image shimi.png is the exact character and style. Preserve the same navy ink stain monster’s silhouette, white eyes, ink droplets and features, large central full body. Paper letterpress print texture, bold navy outlines and flat limited navy #1f2a44, pale grey #9fb3bf, cream #f3ead8, little vermilion #c8462f. Make the meaning immediately obvious with large recognizable objects. Pure flat solid #00ff00 green background, no ground, shadows, scenery background, letters, numbers or symbols. Scene: holding a big slice of cream cake in one hand and a large sandwich in the other

## 単語の絵：c2-058

Square game illustration; reference image shimi.png is the exact character and style. Preserve the same navy ink stain monster’s silhouette, white eyes, ink droplets and features, large central full body. Paper letterpress print texture, bold navy outlines and flat limited navy #1f2a44, pale grey #9fb3bf, cream #f3ead8, little vermilion #c8462f. Make the meaning immediately obvious with large recognizable objects. Pure flat solid #00ff00 green background, no ground, shadows, scenery background, letters, numbers or symbols. Scene: handing a message to another creature and ringing a bell to alert them

## 単語の絵：c2-063

Square game illustration; reference image shimi.png is the exact character and style. Preserve the same navy ink stain monster’s silhouette, white eyes, ink droplets and features, large central full body. Paper letterpress print texture, bold navy outlines and flat limited navy #1f2a44, pale grey #9fb3bf, cream #f3ead8, little vermilion #c8462f. Make the meaning immediately obvious with large recognizable objects. Pure flat solid #00ff00 green background, no ground, shadows, scenery background, letters, numbers or symbols. Scene: struggling to get through a broken door blocked by obstacles, visibly inconvenienced

## 単語の絵：c2-068

Square game illustration; reference image shimi.png is the exact character and style. Preserve the same navy ink stain monster’s silhouette, white eyes, ink droplets and features, large central full body. Paper letterpress print texture, bold navy outlines and flat limited navy #1f2a44, pale grey #9fb3bf, cream #f3ead8, little vermilion #c8462f. Make the meaning immediately obvious with large recognizable objects. Pure flat solid #00ff00 green background, no ground, shadows, scenery background, letters, numbers or symbols. Scene: enjoying a picnic on a blanket with a basket of food, tent and sun

## 単語の絵：c2-073

Square game illustration; reference image shimi.png is the exact character and style. Preserve the same navy ink stain monster’s silhouette, white eyes, ink droplets and features, large central full body. Paper letterpress print texture, bold navy outlines and flat limited navy #1f2a44, pale grey #9fb3bf, cream #f3ead8, little vermilion #c8462f. Make the meaning immediately obvious with large recognizable objects. Pure flat solid #00ff00 green background, no ground, shadows, scenery background, letters, numbers or symbols. Scene: arguing with a second creature, pointing in opposite directions, contradicting

## 単語の絵：c2-078

Square game illustration; reference image shimi.png is the exact character and style. Preserve the same navy ink stain monster’s silhouette, white eyes, ink droplets and features, large central full body. Paper letterpress print texture, bold navy outlines and flat limited navy #1f2a44, pale grey #9fb3bf, cream #f3ead8, little vermilion #c8462f. Make the meaning immediately obvious with large recognizable objects. Pure flat solid #00ff00 green background, no ground, shadows, scenery background, letters, numbers or symbols. Scene: typing on an oversized computer keyboard with clearly visible blank keys

## 単語の絵：c2-083

Square game illustration; reference image shimi.png is the exact character and style. Preserve the same navy ink stain monster’s silhouette, white eyes, ink droplets and features, large central full body. Paper letterpress print texture, bold navy outlines and flat limited navy #1f2a44, pale grey #9fb3bf, cream #f3ead8, little vermilion #c8462f. Make the meaning immediately obvious with large recognizable objects. Pure flat solid #00ff00 green background, no ground, shadows, scenery background, letters, numbers or symbols. Scene: receiving a large certificate scroll with ribbon and seal

## 単語の絵：c2-089

Square game illustration; reference image shimi.png is the exact character and style. Preserve the same navy ink stain monster’s silhouette, white eyes, ink droplets and features, large central full body. Paper letterpress print texture, bold navy outlines and flat limited navy #1f2a44, pale grey #9fb3bf, cream #f3ead8, little vermilion #c8462f. Make the meaning immediately obvious with large recognizable objects. Pure flat solid #00ff00 green background, no ground, shadows, scenery background, letters, numbers or symbols. Scene: stepping from a small plain chair to a large luxurious chair, an upgrade

## 単語の絵：c2-094

Square game illustration; reference image shimi.png is the exact character and style. Preserve the same navy ink stain monster’s silhouette, white eyes, ink droplets and features, large central full body. Paper letterpress print texture, bold navy outlines and flat limited navy #1f2a44, pale grey #9fb3bf, cream #f3ead8, little vermilion #c8462f. Make the meaning immediately obvious with large recognizable objects. Pure flat solid #00ff00 green background, no ground, shadows, scenery background, letters, numbers or symbols. Scene: opening a tall wardrobe showing hanging clothes and a large drawer

## 単語の絵：c2-099

Square game illustration; reference image shimi.png is the exact character and style. Preserve the same navy ink stain monster’s silhouette, white eyes, ink droplets and features, large central full body. Paper letterpress print texture, bold navy outlines and flat limited navy #1f2a44, pale grey #9fb3bf, cream #f3ead8, little vermilion #c8462f. Make the meaning immediately obvious with large recognizable objects. Pure flat solid #00ff00 green background, no ground, shadows, scenery background, letters, numbers or symbols. Scene: presenting a television, radio and stack of newspapers, media

## 単語の絵：c2-104

Square game illustration; reference image shimi.png is the exact character and style. Preserve the same navy ink stain monster’s silhouette, white eyes, ink droplets and features, large central full body. Paper letterpress print texture, bold navy outlines and flat limited navy #1f2a44, pale grey #9fb3bf, cream #f3ead8, little vermilion #c8462f. Make the meaning immediately obvious with large recognizable objects. Pure flat solid #00ff00 green background, no ground, shadows, scenery background, letters, numbers or symbols. Scene: receiving an assignment paper and placing completed papers in a submission box

## 単語の絵：c2-109

Square game illustration; reference image shimi.png is the exact character and style. Preserve the same navy ink stain monster’s silhouette, white eyes, ink droplets and features, large central full body. Paper letterpress print texture, bold navy outlines and flat limited navy #1f2a44, pale grey #9fb3bf, cream #f3ead8, little vermilion #c8462f. Make the meaning immediately obvious with large recognizable objects. Pure flat solid #00ff00 green background, no ground, shadows, scenery background, letters, numbers or symbols. Scene: lifting large dumbbells with a towel and sweat, exercising at a gym

## 単語の絵：c2-114

Square game illustration; reference image shimi.png is the exact character and style. Preserve the same navy ink stain monster’s silhouette, white eyes, ink droplets and features, large central full body. Paper letterpress print texture, bold navy outlines and flat limited navy #1f2a44, pale grey #9fb3bf, cream #f3ead8, little vermilion #c8462f. Make the meaning immediately obvious with large recognizable objects. Pure flat solid #00ff00 green background, no ground, shadows, scenery background, letters, numbers or symbols. Scene: carrying a large open paper folder filled with sheets

## 単語の絵：c2-119

Square game illustration; reference image shimi.png is the exact character and style. Preserve the same navy ink stain monster’s silhouette, white eyes, ink droplets and features, large central full body. Paper letterpress print texture, bold navy outlines and flat limited navy #1f2a44, pale grey #9fb3bf, cream #f3ead8, little vermilion #c8462f. Make the meaning immediately obvious with large recognizable objects. Pure flat solid #00ff00 green background, no ground, shadows, scenery background, letters, numbers or symbols. Scene: clutching its empty stomach while staring hungrily at a big meal

## 単語の絵：c2-124

Square game illustration; reference image shimi.png is the exact character and style. Preserve the same navy ink stain monster’s silhouette, white eyes, ink droplets and features, large central full body. Paper letterpress print texture, bold navy outlines and flat limited navy #1f2a44, pale grey #9fb3bf, cream #f3ead8, little vermilion #c8462f. Make the meaning immediately obvious with large recognizable objects. Pure flat solid #00ff00 green background, no ground, shadows, scenery background, letters, numbers or symbols. Scene: mixing eggs, flour, milk and tomatoes in a bowl beside an open illustrated cookbook

## 単語の絵：c2-129

Square game illustration; reference image shimi.png is the exact character and style. Preserve the same navy ink stain monster’s silhouette, white eyes, ink droplets and features, large central full body. Paper letterpress print texture, bold navy outlines and flat limited navy #1f2a44, pale grey #9fb3bf, cream #f3ead8, little vermilion #c8462f. Make the meaning immediately obvious with large recognizable objects. Pure flat solid #00ff00 green background, no ground, shadows, scenery background, letters, numbers or symbols. Scene: in a white lab coat mixing bubbling flasks and test tubes in a laboratory

## 単語の絵：c2-150

Square game illustration; reference image shimi.png is the exact character and style. Preserve the same navy ink stain monster’s silhouette, white eyes, ink droplets and features, large central full body. Paper letterpress print texture, bold navy outlines and flat limited navy #1f2a44, pale grey #9fb3bf, cream #f3ead8, little vermilion #c8462f. Make the meaning immediately obvious with large recognizable objects. Pure flat solid #00ff00 green background, no ground, shadows, scenery background, letters, numbers or symbols. Scene: presenting large pencils, scissors, tape and notebooks on a desk, stationery

## 単語の絵：c2-155

Square game illustration; reference image shimi.png is the exact character and style. Preserve the same navy ink stain monster’s silhouette, white eyes, ink droplets and features, large central full body. Paper letterpress print texture, bold navy outlines and flat limited navy #1f2a44, pale grey #9fb3bf, cream #f3ead8, little vermilion #c8462f. Make the meaning immediately obvious with large recognizable objects. Pure flat solid #00ff00 green background, no ground, shadows, scenery background, letters, numbers or symbols. Scene: gritting teeth in annoyance as a tiny buzzing creature pesters its head

## 単語の絵：c2-160

Square game illustration; reference image shimi.png is the exact character and style. Preserve the same navy ink stain monster’s silhouette, white eyes, ink droplets and features, large central full body. Paper letterpress print texture, bold navy outlines and flat limited navy #1f2a44, pale grey #9fb3bf, cream #f3ead8, little vermilion #c8462f. Make the meaning immediately obvious with large recognizable objects. Pure flat solid #00ff00 green background, no ground, shadows, scenery background, letters, numbers or symbols. Scene: at a hotel reception desk presenting multiple available keys and empty rooms

## 単語の絵：c2-165

Square game illustration; reference image shimi.png is the exact character and style. Preserve the same navy ink stain monster’s silhouette, white eyes, ink droplets and features, large central full body. Paper letterpress print texture, bold navy outlines and flat limited navy #1f2a44, pale grey #9fb3bf, cream #f3ead8, little vermilion #c8462f. Make the meaning immediately obvious with large recognizable objects. Pure flat solid #00ff00 green background, no ground, shadows, scenery background, letters, numbers or symbols. Scene: looking unhappy with drooping mouth, dejected posture and a grey cloud overhead

## 単語の絵：c2-170

Square game illustration; reference image shimi.png is the exact character and style. Preserve the same navy ink stain monster’s silhouette, white eyes, ink droplets and features, large central full body. Paper letterpress print texture, bold navy outlines and flat limited navy #1f2a44, pale grey #9fb3bf, cream #f3ead8, little vermilion #c8462f. Make the meaning immediately obvious with large recognizable objects. Pure flat solid #00ff00 green background, no ground, shadows, scenery background, letters, numbers or symbols. Scene: riding in a clearly recognizable airplane flying above clouds

## 単語の絵：c2-035
nijimi.png の魔物が印刷機で製本された本を作り、本の山がそばにある。c1-051.png の版画風、純緑背景、文字・数字・記号なし。

## 単語の絵：c2-052
Use case illustration-story, square game asset. Image 1 is exact character reference: preserve envelope body, flap, one sad eye, thin limbs and ink stains. Image 2 is style reference. One central full-body envelope monster, large and recognizable. Paper letterpress print, thick navy outlines, flat navy #1f2a44, mist #9fb3bf, paper #f3ead8 and little vermilion #c8462f, white eye, paper texture. Background absolutely flat solid pure green #00ff00 without ground, shadow or pattern; no green inside subject. No letters, numbers, symbols or speech bubbles. Meaning must be visually clear. Depict character eating small snacks beside a large cup of drink with a straw. 

## 単語の絵：c2-040
nijimi.png の魔物がバスの入口で運賃箱に硬貨を入れる。c1-051.png の版画風、純緑背景、文字・数字・記号なし。

## 単語の絵：c2-057
Use case illustration-story, square game asset. Image 1 is exact character reference: preserve envelope body, flap, one sad eye, thin limbs and ink stains. Image 2 is style reference. One central full-body envelope monster, large and recognizable. Paper letterpress print, thick navy outlines, flat navy #1f2a44, mist #9fb3bf, paper #f3ead8 and little vermilion #c8462f, white eye, paper texture. Background absolutely flat solid pure green #00ff00 without ground, shadow or pattern; no green inside subject. No letters, numbers, symbols or speech bubbles. Meaning must be visually clear. Depict character riding a large clearly recognizable two-wheeled bicycle. 

## 単語の絵：c2-085
nijimi.png の魔物がシャツについた大きな白紙の値札を持ち、近くに硬貨がある。c1-051.png の版画風、純緑背景、文字・数字・記号なし。

## 単語の絵：c2-045
nijimi.png の魔物が大きな車輪付きスーツケースを引き、ブリーフケースを持つ。c1-051.png の版画風、純緑背景、文字・数字・記号なし。

## 単語の絵：c2-118
Use case illustration-story, square game asset. Image 1 is exact character reference: preserve envelope body, flap, one sad eye, thin limbs and ink stains. Image 2 is style reference. One central full-body envelope monster, large and recognizable. Paper letterpress print, thick navy outlines, flat navy #1f2a44, mist #9fb3bf, paper #f3ead8 and little vermilion #c8462f, white eye, paper texture. Background absolutely flat solid pure green #00ff00 without ground, shadow or pattern; no green inside subject. No letters, numbers, symbols or speech bubbles. Meaning must be visually clear. Depict character connecting a water pipe and power cable to a house. 

## 単語の絵：c2-050
nijimi.png の魔物がテーブルにつき、トレーとコーヒーを前にフォークで食事する。c1-051.png の版画風、純緑背景、文字・数字・記号なし。

## 単語の絵：c2-062
Use case illustration-story, square game asset. Image 1 is exact character reference: preserve envelope body, flap, one sad eye, thin limbs and ink stains. Image 2 is style reference. One central full-body envelope monster, large and recognizable. Paper letterpress print, thick navy outlines, flat navy #1f2a44, mist #9fb3bf, paper #f3ead8 and little vermilion #c8462f, white eye, paper texture. Background absolutely flat solid pure green #00ff00 without ground, shadow or pattern; no green inside subject. No letters, numbers, symbols or speech bubbles. Meaning must be visually clear. Depict character reaching easily from home to a nearby shop and bus stop. 

## 単語の絵：c2-070
nijimi.png の魔物がスーツケースと共に道の終点の旗へ到着する。c1-051.png の版画風、純緑背景、文字・数字・記号なし。

## 単語の絵：c2-025
nijimi.png の魔物がテーブルの生徒たちに陶芸を実演し、体験型ワークショップを指導する。c1-051.png の版画風、純緑背景、文字・数字・記号なし。

## 単語の絵：c2-093
Use case illustration-story, square game asset. Image 1 is exact character reference: preserve envelope body, flap, one sad eye, thin limbs and ink stains. Image 2 is style reference. One central full-body envelope monster, large and recognizable. Paper letterpress print, thick navy outlines, flat navy #1f2a44, mist #9fb3bf, paper #f3ead8 and little vermilion #c8462f, white eye, paper texture. Background absolutely flat solid pure green #00ff00 without ground, shadow or pattern; no green inside subject. No letters, numbers, symbols or speech bubbles. Meaning must be visually clear. Depict character working and chatting with a coworker at neighboring office desks. 

## 単語の絵：c2-067
Use case illustration-story, square game asset. Image 1 is exact character reference: preserve envelope body, flap, one sad eye, thin limbs and ink stains. Image 2 is style reference. One central full-body envelope monster, large and recognizable. Paper letterpress print, thick navy outlines, flat navy #1f2a44, mist #9fb3bf, paper #f3ead8 and little vermilion #c8462f, white eye, paper texture. Background absolutely flat solid pure green #00ff00 without ground, shadow or pattern; no green inside subject. No letters, numbers, symbols or speech bubbles. Meaning must be visually clear. Depict character holding a large unmistakably oval egg-shaped mirror. 

## 単語の絵：c2-098
Use case illustration-story, square game asset. Image 1 is exact character reference: preserve envelope body, flap, one sad eye, thin limbs and ink stains. Image 2 is style reference. One central full-body envelope monster, large and recognizable. Paper letterpress print, thick navy outlines, flat navy #1f2a44, mist #9fb3bf, paper #f3ead8 and little vermilion #c8462f, white eye, paper texture. Background absolutely flat solid pure green #00ff00 without ground, shadow or pattern; no green inside subject. No letters, numbers, symbols or speech bubbles. Meaning must be visually clear. Depict character holding a large unmistakable glowing table lamp. 

## 単語の絵：c2-060
nijimi.png の魔物が開いたカーテン越しに映画の小さな画面をのぞき見る。c1-051.png の版画風、純緑背景、文字・数字・記号なし。

## 単語の絵：c2-106
nijimi.png の魔物がプレゼントと風船に囲まれ誕生日ケーキのろうそくを吹き消す。c1-051.png の版画風、純緑背景、文字・数字・記号なし。

## 単語の絵：c2-072
Use case illustration-story, square game asset. Image 1 is exact character reference: preserve envelope body, flap, one sad eye, thin limbs and ink stains. Image 2 is style reference. One central full-body envelope monster, large and recognizable. Paper letterpress print, thick navy outlines, flat navy #1f2a44, mist #9fb3bf, paper #f3ead8 and little vermilion #c8462f, white eye, paper texture. Background absolutely flat solid pure green #00ff00 without ground, shadow or pattern; no green inside subject. No letters, numbers, symbols or speech bubbles. Meaning must be visually clear. Depict character moving an appointment token from one calendar page to a later calendar page. 

## 単語の絵：c2-116
nijimi.png の魔物が他の人のために寄付箱へ硬貨と衣類を入れる。c1-051.png の版画風、純緑背景、文字・数字・記号なし。

## 単語の絵：c2-103
Use case illustration-story, square game asset. Image 1 is exact character reference: preserve envelope body, flap, one sad eye, thin limbs and ink stains. Image 2 is style reference. One central full-body envelope monster, large and recognizable. Paper letterpress print, thick navy outlines, flat navy #1f2a44, mist #9fb3bf, paper #f3ead8 and little vermilion #c8462f, white eye, paper texture. Background absolutely flat solid pure green #00ff00 without ground, shadow or pattern; no green inside subject. No letters, numbers, symbols or speech bubbles. Meaning must be visually clear. Depict character drawing a straight underline with a pen beneath blank horizontal rows, no letters. 

## 単語の絵：c2-011

Square game illustration. Image 1 is the exact character reference: preserve the same single fluffy mist-gray dust ball body, dark navy outline, thin arms and legs, white eyes, red ink accents; make it the central large full-body protagonist. Image 2 is style reference. Paper and letterpress ink print, thick navy outlines, flat limited color blocks, visible paper texture, slightly cute spooky ink-stain monster. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning immediately obvious using large clear everyday objects. Background pure flat solid chroma green #00ff00 only, no ground, shadow, pattern or gradient. No green on characters or props. No letters, numbers, symbols, writing, logos or text anywhere. One monster only; supporting humans where necessary. Full body, not cropped. Scene: pressing the lid of a large photocopier, identical blank sheets emerging

## 単語の絵：c2-016

Square game illustration. Image 1 is the exact character reference: preserve the same single fluffy mist-gray dust ball body, dark navy outline, thin arms and legs, white eyes, red ink accents; make it the central large full-body protagonist. Image 2 is style reference. Paper and letterpress ink print, thick navy outlines, flat limited color blocks, visible paper texture, slightly cute spooky ink-stain monster. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning immediately obvious using large clear everyday objects. Background pure flat solid chroma green #00ff00 only, no ground, shadow, pattern or gradient. No green on characters or props. No letters, numbers, symbols, writing, logos or text anywhere. One monster only; supporting humans where necessary. Full body, not cropped. Scene: pointing happily to a future day on a blank calendar, with a small clock nearby

## 単語の絵：c2-021

Square game illustration. Image 1 is the exact character reference: preserve the same single fluffy mist-gray dust ball body, dark navy outline, thin arms and legs, white eyes, red ink accents; make it the central large full-body protagonist. Image 2 is style reference. Paper and letterpress ink print, thick navy outlines, flat limited color blocks, visible paper texture, slightly cute spooky ink-stain monster. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning immediately obvious using large clear everyday objects. Background pure flat solid chroma green #00ff00 only, no ground, shadow, pattern or gradient. No green on characters or props. No letters, numbers, symbols, writing, logos or text anywhere. One monster only; supporting humans where necessary. Full body, not cropped. Scene: a trainee in oversized work uniform carefully learning to bake by copying a human expert

## 単語の絵：c2-026

Square game illustration. Image 1 is the exact character reference: preserve the same single fluffy mist-gray dust ball body, dark navy outline, thin arms and legs, white eyes, red ink accents; make it the central large full-body protagonist. Image 2 is style reference. Paper and letterpress ink print, thick navy outlines, flat limited color blocks, visible paper texture, slightly cute spooky ink-stain monster. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning immediately obvious using large clear everyday objects. Background pure flat solid chroma green #00ff00 only, no ground, shadow, pattern or gradient. No green on characters or props. No letters, numbers, symbols, writing, logos or text anywhere. One monster only; supporting humans where necessary. Full body, not cropped. Scene: presenting at a microphone, pointing at a screen with simple pictorial shapes, a small audience

## 単語の絵：c2-031

Square game illustration. Image 1 is the exact character reference: preserve the same single fluffy mist-gray dust ball body, dark navy outline, thin arms and legs, white eyes, red ink accents; make it the central large full-body protagonist. Image 2 is style reference. Paper and letterpress ink print, thick navy outlines, flat limited color blocks, visible paper texture, slightly cute spooky ink-stain monster. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning immediately obvious using large clear everyday objects. Background pure flat solid chroma green #00ff00 only, no ground, shadow, pattern or gradient. No green on characters or props. No letters, numbers, symbols, writing, logos or text anywhere. One monster only; supporting humans where necessary. Full body, not cropped. Scene: an accountant checking coins and a ledger with a magnifying glass, abacus nearby

## 単語の絵：c2-036

Square game illustration. Image 1 is the exact character reference: preserve the same single fluffy mist-gray dust ball body, dark navy outline, thin arms and legs, white eyes, red ink accents; make it the central large full-body protagonist. Image 2 is style reference. Paper and letterpress ink print, thick navy outlines, flat limited color blocks, visible paper texture, slightly cute spooky ink-stain monster. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning immediately obvious using large clear everyday objects. Background pure flat solid chroma green #00ff00 only, no ground, shadow, pattern or gradient. No green on characters or props. No letters, numbers, symbols, writing, logos or text anywhere. One monster only; supporting humans where necessary. Full body, not cropped. Scene: nervously presenting a blank résumé with a portrait to an interviewer across a desk

## 単語の絵：c2-041

Square game illustration. Image 1 is the exact character reference: preserve the same single fluffy mist-gray dust ball body, dark navy outline, thin arms and legs, white eyes, red ink accents; make it the central large full-body protagonist. Image 2 is style reference. Paper and letterpress ink print, thick navy outlines, flat limited color blocks, visible paper texture, slightly cute spooky ink-stain monster. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning immediately obvious using large clear everyday objects. Background pure flat solid chroma green #00ff00 only, no ground, shadow, pattern or gradient. No green on characters or props. No letters, numbers, symbols, writing, logos or text anywhere. One monster only; supporting humans where necessary. Full body, not cropped. Scene: a traveler with large backpack, folded map and camera

## 単語の絵：c2-046

Square game illustration. Image 1 is the exact character reference: preserve the same single fluffy mist-gray dust ball body, dark navy outline, thin arms and legs, white eyes, red ink accents; make it the central large full-body protagonist. Image 2 is style reference. Paper and letterpress ink print, thick navy outlines, flat limited color blocks, visible paper texture, slightly cute spooky ink-stain monster. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning immediately obvious using large clear everyday objects. Background pure flat solid chroma green #00ff00 only, no ground, shadow, pattern or gradient. No green on characters or props. No letters, numbers, symbols, writing, logos or text anywhere. One monster only; supporting humans where necessary. Full body, not cropped. Scene: loading prominent parcels onto a delivery van

## 単語の絵：c2-051

Square game illustration. Image 1 is the exact character reference: preserve the same single fluffy mist-gray dust ball body, dark navy outline, thin arms and legs, white eyes, red ink accents; make it the central large full-body protagonist. Image 2 is style reference. Paper and letterpress ink print, thick navy outlines, flat limited color blocks, visible paper texture, slightly cute spooky ink-stain monster. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning immediately obvious using large clear everyday objects. Background pure flat solid chroma green #00ff00 only, no ground, shadow, pattern or gradient. No green on characters or props. No letters, numbers, symbols, writing, logos or text anywhere. One monster only; supporting humans where necessary. Full body, not cropped. Scene: a chef wearing tall white chef hat cooking food in a frying pan

## 単語の絵：c2-056

Square game illustration. Image 1 is the exact character reference: preserve the same single fluffy mist-gray dust ball body, dark navy outline, thin arms and legs, white eyes, red ink accents; make it the central large full-body protagonist. Image 2 is style reference. Paper and letterpress ink print, thick navy outlines, flat limited color blocks, visible paper texture, slightly cute spooky ink-stain monster. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning immediately obvious using large clear everyday objects. Background pure flat solid chroma green #00ff00 only, no ground, shadow, pattern or gradient. No green on characters or props. No letters, numbers, symbols, writing, logos or text anywhere. One monster only; supporting humans where necessary. Full body, not cropped. Scene: showing a valid pass with a portrait to a guard at an open entrance gate

## 単語の絵：c2-066

Square game illustration. Image 1 is the exact character reference: preserve the same single fluffy mist-gray dust ball body, dark navy outline, thin arms and legs, white eyes, red ink accents; make it the central large full-body protagonist. Image 2 is style reference. Paper and letterpress ink print, thick navy outlines, flat limited color blocks, visible paper texture, slightly cute spooky ink-stain monster. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning immediately obvious using large clear everyday objects. Background pure flat solid chroma green #00ff00 only, no ground, shadow, pattern or gradient. No green on characters or props. No letters, numbers, symbols, writing, logos or text anywhere. One monster only; supporting humans where necessary. Full body, not cropped. Scene: delightedly receiving a large wrapped gift into its hands

## 単語の絵：c2-071

Square game illustration. Image 1 is the exact character reference: preserve the same single fluffy mist-gray dust ball body, dark navy outline, thin arms and legs, white eyes, red ink accents; make it the central large full-body protagonist. Image 2 is style reference. Paper and letterpress ink print, thick navy outlines, flat limited color blocks, visible paper texture, slightly cute spooky ink-stain monster. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning immediately obvious using large clear everyday objects. Background pure flat solid chroma green #00ff00 only, no ground, shadow, pattern or gradient. No green on characters or props. No letters, numbers, symbols, writing, logos or text anywhere. One monster only; supporting humans where necessary. Full body, not cropped. Scene: proudly wearing a carpenter's work apron and carrying hammer and saw

## 単語の絵：c2-076

Square game illustration. Image 1 is the exact character reference: preserve the same single fluffy mist-gray dust ball body, dark navy outline, thin arms and legs, white eyes, red ink accents; make it the central large full-body protagonist. Image 2 is style reference. Paper and letterpress ink print, thick navy outlines, flat limited color blocks, visible paper texture, slightly cute spooky ink-stain monster. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning immediately obvious using large clear everyday objects. Background pure flat solid chroma green #00ff00 only, no ground, shadow, pattern or gradient. No green on characters or props. No letters, numbers, symbols, writing, logos or text anywhere. One monster only; supporting humans where necessary. Full body, not cropped. Scene: looking up at a large thick gray cloud hiding the sun

## 単語の絵：c2-081

Square game illustration. Image 1 is the exact character reference: preserve the same single fluffy mist-gray dust ball body, dark navy outline, thin arms and legs, white eyes, red ink accents; make it the central large full-body protagonist. Image 2 is style reference. Paper and letterpress ink print, thick navy outlines, flat limited color blocks, visible paper texture, slightly cute spooky ink-stain monster. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning immediately obvious using large clear everyday objects. Background pure flat solid chroma green #00ff00 only, no ground, shadow, pattern or gradient. No green on characters or props. No letters, numbers, symbols, writing, logos or text anywhere. One monster only; supporting humans where necessary. Full body, not cropped. Scene: sick in bed, thermometer in mouth, holding medicine and a glass of water

## 単語の絵：c2-086

Square game illustration. Image 1 is the exact character reference: preserve the same single fluffy mist-gray dust ball body, dark navy outline, thin arms and legs, white eyes, red ink accents; make it the central large full-body protagonist. Image 2 is style reference. Paper and letterpress ink print, thick navy outlines, flat limited color blocks, visible paper texture, slightly cute spooky ink-stain monster. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning immediately obvious using large clear everyday objects. Background pure flat solid chroma green #00ff00 only, no ground, shadow, pattern or gradient. No green on characters or props. No letters, numbers, symbols, writing, logos or text anywhere. One monster only; supporting humans where necessary. Full body, not cropped. Scene: waving goodbye from a departing train window, a person waving from platform

## 単語の絵：c2-092

Square game illustration. Image 1 is the exact character reference: preserve the same single fluffy mist-gray dust ball body, dark navy outline, thin arms and legs, white eyes, red ink accents; make it the central large full-body protagonist. Image 2 is style reference. Paper and letterpress ink print, thick navy outlines, flat limited color blocks, visible paper texture, slightly cute spooky ink-stain monster. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning immediately obvious using large clear everyday objects. Background pure flat solid chroma green #00ff00 only, no ground, shadow, pattern or gradient. No green on characters or props. No letters, numbers, symbols, writing, logos or text anywhere. One monster only; supporting humans where necessary. Full body, not cropped. Scene: walking in front leading a line of people behind it

## 単語の絵：c2-130

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser debris creature, gray-blue craggy round body, cream face and claws, yellow eyes, dark navy jagged mouth, red wisps, paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: highway: Keshikasu standing beside a wide multi-lane road full of cars and trucks speeding.

## 単語の絵：c2-087

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser-shavings creature with rounded blue-gray layered crumb body, cream face, yellow eyes, jagged navy mouth, dark navy outlines, cream fragments and vermilion curls. Paper and letterpress ink printmaking, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols.
Subject: Keshikasu planning moves on a map with toy soldiers and flags, sly smile, sketching a battle plan.

## 単語の絵：c2-001

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character: paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Preserve Keshikasu's round blue-gray eraser-crumb body, cream fragments and face, yellow eyes, jagged navy mouth, vermilion wisps and clawed limbs. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: Keshikasu in a top hat tipping it politely with a formal bow and a neat bow tie, greeting a stranger.

## 単語の絵：c2-044

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached Keshikasu character exactly: eraser-shaving creature, blue-gray textured round body, cream fragments and claws, red wisps, yellow eyes and dark jagged mouth. Paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: Keshikasu riding a train in a dark tunnel under the ground, a small bus shuttling back and forth between two stops behind it.

## 単語の絵：c2-131

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser debris creature, gray-blue craggy round body, cream face and claws, yellow eyes, dark navy jagged mouth, red wisps, paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: respondent and questionnaire: Keshikasu answering a survey held by a person with a clipboard and marking boxes on a long blank sheet with a pencil.

## 単語の絵：c2-002

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character: paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Preserve Keshikasu's round blue-gray eraser-crumb body, cream fragments and face, yellow eyes, jagged navy mouth, vermilion wisps and clawed limbs. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: Keshikasu lounging on a deck chair on a big cruise ship with sunglasses and a cool drink, ocean around.

## 単語の絵：c2-088

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser-shavings creature with rounded blue-gray layered crumb body, cream face, yellow eyes, jagged navy mouth, dark navy outlines, cream fragments and vermilion curls. Paper and letterpress ink printmaking, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols.
Subject: Keshikasu with a paint roller and hammer remaking an old room into a new one, new furniture arriving.

## 単語の絵：c2-045

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached Keshikasu character exactly: eraser-shaving creature, blue-gray textured round body, cream fragments and claws, red wisps, yellow eyes and dark jagged mouth. Paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: Keshikasu dragging a pile of travel cases, a big hard-shell suitcase and a slim briefcase through a station, tired.

## 単語の絵：c2-132

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser debris creature, gray-blue craggy round body, cream face and claws, yellow eyes, dark navy jagged mouth, red wisps, paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: jewelry: Keshikasu wearing a sparkling necklace, ring and earrings, gems glittering.

## 単語の絵：c2-003

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character: paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Preserve Keshikasu's round blue-gray eraser-crumb body, cream fragments and face, yellow eyes, jagged navy mouth, vermilion wisps and clawed limbs. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: Keshikasu in a tidy suit and another Keshikasu carrying many shopping bags out of a store, customers happy.

## 単語の絵：c2-089

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser-shavings creature with rounded blue-gray layered crumb body, cream face, yellow eyes, jagged navy mouth, dark navy outlines, cream fragments and vermilion curls. Paper and letterpress ink printmaking, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols.
Subject: Keshikasu stepping up from a small seat to a bigger shiny luxury seat, a grand upgrade.

## 単語の絵：c2-046

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached Keshikasu character exactly: eraser-shaving creature, blue-gray textured round body, cream fragments and claws, red wisps, yellow eyes and dark jagged mouth. Paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: Keshikasu loading boxes onto a delivery van, a courier creature running with a parcel while a conveyor sends boxes to many shops.

## 単語の絵：c2-004

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character: paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Preserve Keshikasu's round blue-gray eraser-crumb body, cream fragments and face, yellow eyes, jagged navy mouth, vermilion wisps and clawed limbs. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: Keshikasu reading a thin glowing tablet held in both hands with a page turning on its screen, a tall stack of paper books left unused beside it.

## 単語の絵：c2-133

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser debris creature, gray-blue craggy round body, cream face and claws, yellow eyes, dark navy jagged mouth, red wisps, paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: overtime: Keshikasu still working at a desk late at night, a moon in the window and a clock past closing, tired.

## 単語の絵：c2-090

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser-shavings creature with rounded blue-gray layered crumb body, cream face, yellow eyes, jagged navy mouth, dark navy outlines, cream fragments and vermilion curls. Paper and letterpress ink printmaking, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols.
Subject: Keshikasu swapping a broken part for a new one and handing back an old pass for a fresh one, old part in a bin.

## 単語の絵：c2-047

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached Keshikasu character exactly: eraser-shaving creature, blue-gray textured round body, cream fragments and claws, red wisps, yellow eyes and dark jagged mouth. Paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: Keshikasu in a bow tie carrying a tray with a plate and glass to a restaurant table, napkin on arm.

## 単語の絵：c2-134

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser debris creature, gray-blue craggy round body, cream face and claws, yellow eyes, dark navy jagged mouth, red wisps, paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: overnight: Keshikasu sleeping in a hotel bed through the whole night, stars and the moon outside.

## 単語の絵：c2-091

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser-shavings creature with rounded blue-gray layered crumb body, cream face, yellow eyes, jagged navy mouth, dark navy outlines, cream fragments and vermilion curls. Paper and letterpress ink printmaking, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols.
Subject: Keshikasu holding a carton of milk gone moldy next to a calendar whose page has run out, an empty hourglass.

## 単語の絵：c2-048

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached Keshikasu character exactly: eraser-shaving creature, blue-gray textured round body, cream fragments and claws, red wisps, yellow eyes and dark jagged mouth. Paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: Keshikasu handing house keys to another creature who gives coins each month, a small apartment house between them.

## 単語の絵：c2-005

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match attached Keshikasu character exactly: round blue-gray eraser crumbs, cream fragments and face, yellow eyes, jagged navy mouth, vermilion wisps and clawed limbs, thick navy outlines, paper and letterpress ink texture. Palette navy, mist, cream, vermilion. Make meaning recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background everywhere around isolated character and props, no scenery filling background, no floor or shadows. No green in subject. No text, letters, numerals or symbols.
Subject: Keshikasu carrying a small suitcase, with a small isolated airport window frame showing a tiny airplane and gate props beside him.

## 単語の絵：c2-135

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser debris creature, gray-blue craggy round body, cream face and claws, yellow eyes, dark navy jagged mouth, red wisps, paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: outstanding: Keshikasu standing on the top of a podium shining brightly above the others, a spotlight.

## 単語の絵：c2-092

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser-shavings creature with rounded blue-gray layered crumb body, cream face, yellow eyes, jagged navy mouth, dark navy outlines, cream fragments and vermilion curls. Paper and letterpress ink printmaking, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols.
Subject: Keshikasu walking in front leading a line of others behind it, going first.

## 単語の絵：c2-006

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match attached Keshikasu character exactly: round blue-gray eraser crumbs, cream fragments and face, yellow eyes, jagged navy mouth, vermilion wisps and clawed limbs, thick navy outlines, paper and letterpress ink texture. Palette navy, mist, cream, vermilion. Make meaning recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background everywhere around isolated character and props, no scenery filling background, no floor or shadows. No green in subject. No text, letters, numerals or symbols.
Subject: Keshikasu at a desk with towering stacks of blank papers and a blank sticky note, stamping documents with a rubber stamp.

## 単語の絵：c2-049

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached Keshikasu character exactly: eraser-shaving creature, blue-gray textured round body, cream fragments and claws, red wisps, yellow eyes and dark jagged mouth. Paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: Keshikasu holding a big shield over a new gadget while a repairman waves, a ribbon promising protection.

## 単語の絵：c2-136

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser debris creature, gray-blue craggy round body, cream face and claws, yellow eyes, dark navy jagged mouth, red wisps, paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: skim: Keshikasu flipping rapidly through a book with eyes darting across blank pages, not reading closely.

## 単語の絵：c2-093

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser-shavings creature with rounded blue-gray layered crumb body, cream face, yellow eyes, jagged navy mouth, dark navy outlines, cream fragments and vermilion curls. Paper and letterpress ink printmaking, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols.
Subject: two Keshikasu at neighboring desks chatting and sharing a snack in an office.

## 単語の絵：c2-050

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached Keshikasu character exactly: eraser-shaving creature, blue-gray textured round body, cream fragments and claws, red wisps, yellow eyes and dark jagged mouth. Paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: Keshikasu sitting at a table in a casual dining hall with a tray, knife and fork and a cup of coffee, eating a meal.

## 単語の絵：c2-137

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser debris creature, gray-blue craggy round body, cream face and claws, yellow eyes, dark navy jagged mouth, red wisps, paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: impact: Keshikasu crashing a ball into a wall creating huge ripples and a big wave of change.

## 単語の絵：c2-094

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser-shavings creature with rounded blue-gray layered crumb body, cream face, yellow eyes, jagged navy mouth, dark navy outlines, cream fragments and vermilion curls. Paper and letterpress ink printmaking, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols.
Subject: Keshikasu opening the doors of a tall cabinet and a drawer, clothes hanging in a closet beside.

## 単語の絵：c2-051

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached Keshikasu character exactly: eraser-shaving creature, blue-gray textured round body, cream fragments and claws, red wisps, yellow eyes and dark jagged mouth. Paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: Keshikasu in a tall white chef hat flipping food in a pan over a flame, big ladle.

## 単語の絵：c2-007

Use case: illustration-story. Game enemy illustration, full-body Keshikasu centered large in square composition. Match attached character: round blue-gray eraser crumbs, cream fragments and face, yellow eyes, jagged navy mouth, vermilion wisps and clawed limbs, thick navy outlines, paper and letterpress texture. Pure flat solid chroma green #00ff00 background, no floor or shadows. No green in subject. No text, letters, numerals, checkmarks or symbols anywhere. All paper pages completely blank.
Subject: Keshikasu at a restaurant host stand holding a pen over a completely blank open reservation book while another creature waits happily.

## 単語の絵：c2-138

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser debris creature, gray-blue craggy round body, cream face and claws, yellow eyes, dark navy jagged mouth, red wisps, paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: innovative: Keshikasu inventing a brand new gadget with a bright light bulb overhead, tools and sparkles.

## 単語の絵：c2-095

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser-shavings creature with rounded blue-gray layered crumb body, cream face, yellow eyes, jagged navy mouth, dark navy outlines, cream fragments and vermilion curls. Paper and letterpress ink printmaking, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols.
Subject: Keshikasu lifting a lid from a plastic box to store things inside, stacks of boxes.

## 単語の絵：c2-052

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached Keshikasu character exactly: eraser-shaving creature, blue-gray textured round body, cream fragments and claws, red wisps, yellow eyes and dark jagged mouth. Paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: Keshikasu munching on small treats with a tray of cups of juice and a tall cold drink with a straw.

## 単語の絵：c2-139

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser debris creature, gray-blue craggy round body, cream face and claws, yellow eyes, dark navy jagged mouth, red wisps, paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: logo: Keshikasu waving a flag with a bold simple pictorial emblem, a stamp of the same brand mark, no letters.

## 単語の絵：c2-096

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser-shavings creature with rounded blue-gray layered crumb body, cream face, yellow eyes, jagged navy mouth, dark navy outlines, cream fragments and vermilion curls. Paper and letterpress ink printmaking, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols.
Subject: Keshikasu surrounded by a toaster, a kettle and a washing machine with cords and plugs, sparks of electricity.

## 単語の絵：c2-053

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached Keshikasu character exactly: eraser-shaving creature, blue-gray textured round body, cream fragments and claws, red wisps, yellow eyes and dark jagged mouth. Paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: Keshikasu holding a slice of cake with cream in one hand and a sandwich stacked with lettuce in the other.

## 単語の絵：c2-008

Use case: illustration-story. Game enemy illustration, full-body Keshikasu centered large in square composition. Match attached character: round blue-gray eraser crumbs, cream fragments and face, yellow eyes, jagged navy mouth, vermilion wisps and clawed limbs, thick navy outlines, paper and letterpress texture. Pure flat solid chroma green #00ff00 background, no floor or shadows. No green in subject. No text, letters, numerals, checkmarks or symbols anywhere.
Subject: Keshikasu with a magnifying glass connecting small pinned photos with red thread on a board, looking thoughtful.

## 単語の絵：c2-097

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser-shavings creature with rounded blue-gray layered crumb body, cream face, yellow eyes, jagged navy mouth, dark navy outlines, cream fragments and vermilion curls. Paper and letterpress ink printmaking, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols.
Subject: Keshikasu slotting a small cylinder cell and a printer cartridge into machines, charging, ink drips.

## 単語の絵：c2-140

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser debris creature, gray-blue craggy round body, cream face and claws, yellow eyes, dark navy jagged mouth, red wisps, paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: photographer: Keshikasu with a big camera around its neck taking a picture of a smiling friend, a tripod.

## 単語の絵：c2-054

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached Keshikasu character exactly: eraser-shaving creature, blue-gray textured round body, cream fragments and claws, red wisps, yellow eyes and dark jagged mouth. Paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: Keshikasu standing in a small metal box with sliding doors, floors of a tall building passing.

## 単語の絵：c2-098

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser-shavings creature with rounded blue-gray layered crumb body, cream face, yellow eyes, jagged navy mouth, dark navy outlines, cream fragments and vermilion curls. Paper and letterpress ink printmaking, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols.
Subject: Keshikasu holding a glowing lamp that lights up a dark room.

## 単語の絵：c2-009

Use case: illustration-story. Game enemy illustration, full-body Keshikasu centered large in square composition. Match attached character: round blue-gray eraser crumbs, cream fragments and face, yellow eyes, jagged navy mouth, vermilion wisps and clawed limbs, thick navy outlines, paper and letterpress texture. Pure flat solid chroma green #00ff00 background, no floor or shadows. No green in subject. No text, letters, numerals, checkmarks or symbols anywhere.
Subject: Keshikasu crouching to find a trail of footprints with a magnifying glass, a single glinting hint nearby.

## 単語の絵：c2-141

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser debris creature, gray-blue craggy round body, cream face and claws, yellow eyes, dark navy jagged mouth, red wisps, paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: aspect: Keshikasu turning a cube around to look at it from a different side, one face lit.

## 単語の絵：c2-099

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser-shavings creature with rounded blue-gray layered crumb body, cream face, yellow eyes, jagged navy mouth, dark navy outlines, cream fragments and vermilion curls. Paper and letterpress ink printmaking, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols.
Subject: Keshikasu in front of a television, radio and a stack of newspapers, news flowing out.

## 単語の絵：c2-055

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached Keshikasu character exactly: eraser-shaving creature, blue-gray textured round body, cream fragments and claws, red wisps, yellow eyes and dark jagged mouth. Paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: Keshikasu checking a finished puzzle with a magnifying glass, every piece fitting perfectly, nodding with confidence.

## 単語の絵：c2-010

Use case: illustration-story. Game enemy illustration, full-body Keshikasu centered large in square composition. Match attached character: round blue-gray eraser crumbs, cream fragments and face, yellow eyes, jagged navy mouth, vermilion wisps and clawed limbs, thick navy outlines, paper and letterpress texture. Pure flat solid chroma green #00ff00 background, no floor or shadows. No green in subject. No text, letters, numerals, checkmarks or symbols anywhere.
Subject: Keshikasu feeding a blank sheet into a boxy fax machine with a telephone handset, an identical blank page emerging from a second machine connected by a wire.

## 単語の絵：c2-142

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser debris creature, gray-blue craggy round body, cream face and claws, yellow eyes, dark navy jagged mouth, red wisps, paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: download: Keshikasu catching a box falling from a cloud on its arms, a progress bar of shapes on a screen.

## 単語の絵：c2-011

Use case: illustration-story. Game enemy illustration, full-body Keshikasu centered large in square composition. Match attached character: round blue-gray eraser crumbs, cream fragments and face, yellow eyes, jagged navy mouth, vermilion wisps and clawed limbs, thick navy outlines, paper and letterpress texture. Pure flat solid chroma green #00ff00 background, no floor or shadows. No green in subject. No text, letters, numerals, checkmarks or symbols anywhere.
Subject: Keshikasu pressing the lid of a big copy machine, a bright light scanning under it, identical blank paper sheets piling out.

## 単語の絵：c2-100

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser-shavings creature with rounded blue-gray layered crumb body, cream face, yellow eyes, jagged navy mouth, dark navy outlines, cream fragments and vermilion curls. Paper and letterpress ink printmaking, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols.
Subject: Keshikasu pushing a cart through a big store with food shelves and many shops along a bright hall.

## 単語の絵：c2-056

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached Keshikasu character exactly: eraser-shaving creature, blue-gray textured round body, cream fragments and claws, red wisps, yellow eyes and dark jagged mouth. Paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: Keshikasu holding up a pass to a gate that opens with a glow, qualifying and approved, the guard nodding.

## 単語の絵：c2-143

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser debris creature, gray-blue craggy round body, cream face and claws, yellow eyes, dark navy jagged mouth, red wisps, paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: password: Keshikasu whispering a secret into a big padlock on a door, key hole glowing.

## 単語の絵：c2-012

Use case: illustration-story. Game enemy illustration, full-body Keshikasu centered large in square composition. Match attached character: round blue-gray eraser crumbs, cream fragments and face, yellow eyes, jagged navy mouth, vermilion wisps and clawed limbs, thick navy outlines, paper and letterpress texture. Pure flat solid chroma green #00ff00 background, no floor or shadows. No green in subject. No text, letters, numerals, checkmarks or symbols anywhere.
Subject: Keshikasu holding an oversized blank clock face with its long hand pointing straight up and short hand pointing right, standing proudly.

## 単語の絵：c2-101

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser-shavings creature with rounded blue-gray layered crumb body, cream face, yellow eyes, jagged navy mouth, dark navy outlines, cream fragments and vermilion curls. Paper and letterpress ink printmaking, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols.
Subject: Keshikasu pushing a shopping cart on wheels down a long narrow path between tall shelves in a store.

## 単語の絵：c2-057

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached Keshikasu character exactly: eraser-shaving creature, blue-gray textured round body, cream fragments and claws, red wisps, yellow eyes and dark jagged mouth. Paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: Keshikasu pedaling a two-wheeled bicycle along a road, hair blowing.

## 単語の絵：c2-144

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser debris creature, gray-blue craggy round body, cream face and claws, yellow eyes, dark navy jagged mouth, red wisps, paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: prohibit: Keshikasu blocked at a door by a huge hand held up like a stop gesture, a guard shaking head.

## 単語の絵：c2-013

Use case: illustration-story. Game enemy illustration, full-body Keshikasu centered large in square composition. Match attached character: round blue-gray eraser crumbs, cream fragments and face, yellow eyes, jagged navy mouth, vermilion wisps and clawed limbs, thick navy outlines, paper and letterpress texture. Pure flat solid chroma green #00ff00 background, no floor or shadows. No green in subject. No text, letters, numerals, checkmarks or symbols anywhere.
Subject: Keshikasu squinting under a bright sun directly overhead, a lunch box in hand.

## 単語の絵：c2-102

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser-shavings creature with rounded blue-gray layered crumb body, cream face, yellow eyes, jagged navy mouth, dark navy outlines, cream fragments and vermilion curls. Paper and letterpress ink printmaking, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols.
Subject: Keshikasu handing a coin at a ticket booth to enter a gate to a park.

## 単語の絵：c2-058

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached Keshikasu character exactly: eraser-shaving creature, blue-gray textured round body, cream fragments and claws, red wisps, yellow eyes and dark jagged mouth. Paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: Keshikasu handing a message to another and ringing a small bell so it knows, informing someone.

## 単語の絵：c2-103

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser-shavings creature with rounded blue-gray layered crumb body, cream face, yellow eyes, jagged navy mouth, dark navy outlines, cream fragments and vermilion curls. Paper and letterpress ink printmaking, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols.
Subject: Keshikasu drawing a bold straight line under a sentence of wavy squiggles with a pen, a ruler.

## 単語の絵：c2-014

Use case: illustration-story. Game enemy illustration, full-body Keshikasu centered large in square composition. Match attached character: round blue-gray eraser crumbs, cream fragments and face, yellow eyes, jagged navy mouth, vermilion wisps and clawed limbs, thick navy outlines, paper and letterpress texture. Pure flat solid chroma green #00ff00 background, no floor or shadows. No green in subject. No text, letters, numerals, checkmarks or symbols anywhere.
Subject: Keshikasu yawning under a big full moon with a tiny sleeping town behind.

## 単語の絵：c2-059

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached Keshikasu character exactly: eraser-shaving creature, blue-gray textured round body, cream fragments and claws, red wisps, yellow eyes and dark jagged mouth. Paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: Keshikasu raising a hand with a big curious expression asking a counter staff a question.

## 単語の絵：c2-145

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match attached Keshikasu precisely: gray-blue eraser debris creature, cream face and claws, yellow eyes, dark navy zigzag mouth, red wisps, textured paper and letterpress ink, thick dark navy outlines. Palette navy #1f2a44, mist #9fb3bf, paper #f3ead8, vermilion #c8462f. Pure flat solid #00ff00 background. No text, letters, numbers, symbols, arrows or sleep marks anywhere.
Subject: weekday: Keshikasu heading to work in morning with briefcase, beside a blank calendar with five columns of tiny briefcase pictures and two columns of empty beds. No writing.

## 単語の絵：c2-015

Use case: illustration-story. Game enemy illustration, full-body Keshikasu centered large in square composition. Match attached character: round blue-gray eraser crumbs, cream fragments and face, yellow eyes, jagged navy mouth, vermilion wisps and clawed limbs, thick navy outlines, paper and letterpress texture. Pure flat solid chroma green #00ff00 background, no floor or shadows. No green in subject. No text, letters, numerals, checkmarks or symbols anywhere.
Subject: Keshikasu finishing a blank letter with a pen, one hand on its chest, bowing respectfully.

## 単語の絵：c2-104

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser-shavings creature with rounded blue-gray layered crumb body, cream face, yellow eyes, jagged navy mouth, dark navy outlines, cream fragments and vermilion curls. Paper and letterpress ink printmaking, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols.
Subject: Keshikasu as teacher handing out a task paper, a student dropping a finished stack into a submission box.

## 単語の絵：c2-060

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached Keshikasu character exactly: eraser-shaving creature, blue-gray textured round body, cream fragments and claws, red wisps, yellow eyes and dark jagged mouth. Paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: Keshikasu peeking through a curtain at a small screen showing a sneak peek of a film.

## 単語の絵：c2-146

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser debris creature, gray-blue craggy round body, cream face and claws, yellow eyes, dark navy jagged mouth, red wisps, paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: bonus: Keshikasu receiving an extra bag of coins as a gift from a smiling boss.

## 単語の絵：c2-016

Use case: illustration-story. Game enemy illustration, full-body Keshikasu centered large in square composition. Match attached character: round blue-gray eraser crumbs, cream fragments and face, yellow eyes, jagged navy mouth, vermilion wisps and clawed limbs, thick navy outlines, paper and letterpress texture. Pure flat solid chroma green #00ff00 background, no floor or shadows. No green in subject. No text, letters, numerals, checkmarks or symbols anywhere.
Subject: Keshikasu pointing at a blank calendar page a few pages ahead with a cheerful thought bubble of itself doing a task later, relaxed.

## 単語の絵：c2-105

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser-shavings creature with rounded blue-gray layered crumb body, cream face, yellow eyes, jagged navy mouth, dark navy outlines, cream fragments and vermilion curls. Paper and letterpress ink printmaking, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols.
Subject: Keshikasu sitting in a seat in the audience of a lecture, an auditorium and a speaker small ahead.

## 単語の絵：c2-061

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached Keshikasu character exactly: eraser-shaving creature, blue-gray textured round body, cream fragments and claws, red wisps, yellow eyes and dark jagged mouth. Paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: Keshikasu receiving a rolled newspaper at its door each morning, paying a monthly coin to a delivery creature.

## 単語の絵：c2-147

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser debris creature, gray-blue craggy round body, cream face and claws, yellow eyes, dark navy jagged mouth, red wisps, paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: ink: Keshikasu dipping a feather pen into an inkwell, black drops.

## 単語の絵：c2-017

Use case: illustration-story. Game enemy illustration, full-body Keshikasu centered large in square composition. Match attached character: round blue-gray eraser crumbs, cream fragments and face, yellow eyes, jagged navy mouth, vermilion wisps and clawed limbs, thick navy outlines, paper and letterpress texture. Pure flat solid chroma green #00ff00 background, no floor or shadows. No green in subject. No text, letters, numerals, checkmarks or symbols anywhere.
Subject: Keshikasu looking over its shoulder at the last few torn-off blank calendar pages lying behind it.

## 単語の絵：c2-106

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser-shavings creature with rounded blue-gray layered crumb body, cream face, yellow eyes, jagged navy mouth, dark navy outlines, cream fragments and vermilion curls. Paper and letterpress ink printmaking, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols.
Subject: Keshikasu in a party hat blowing out the candles on a cake with balloons and presents.

## 単語の絵：c2-062

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached Keshikasu character exactly: eraser-shaving creature, blue-gray textured round body, cream fragments and claws, red wisps, yellow eyes and dark jagged mouth. Paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: Keshikasu relaxing in a house where the store, bus stop and everything is right next door, everything within easy reach.

## 単語の絵：c2-148

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser debris creature, gray-blue craggy round body, cream face and claws, yellow eyes, dark navy jagged mouth, red wisps, paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: cleaner: Keshikasu with a mop and bucket polishing a floor, a spray bottle, shiny clean.

## 単語の絵：c2-018

Use case: illustration-story. Game enemy illustration, full-body Keshikasu centered large in square composition. Match attached character: round blue-gray eraser crumbs, cream fragments and face, yellow eyes, jagged navy mouth, vermilion wisps and clawed limbs, thick navy outlines, paper and letterpress texture. Pure flat solid chroma green #00ff00 background, no floor or shadows. No green in subject. No text, letters, numerals, checkmarks or symbols anywhere.
Subject: Keshikasu as a boss standing on a platform watching a row of busy workers with folded arms, keeping an eye on everyone.

## 単語の絵：c2-107

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser-shavings creature with rounded blue-gray layered crumb body, cream face, yellow eyes, jagged navy mouth, dark navy outlines, cream fragments and vermilion curls. Paper and letterpress ink printmaking, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols.
Subject: Keshikasu reading a short passage then nodding with a bright aha look, a light bulb coming on in understanding.

## 単語の絵：c2-063

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached Keshikasu character exactly: eraser-shaving creature, blue-gray textured round body, cream fragments and claws, red wisps, yellow eyes and dark jagged mouth. Paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: Keshikasu tangled in a hassle, struggling with a broken door and a long detour, unlucky.

## 単語の絵：c2-149

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser debris creature, gray-blue craggy round body, cream face and claws, yellow eyes, dark navy jagged mouth, red wisps, paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: headquarters: Keshikasu in front of a big tall building with a flag on top, smaller branch buildings far around.

## 単語の絵：c2-019

Use case: illustration-story. Game enemy illustration, full-body Keshikasu centered large in square composition. Match attached character: round blue-gray eraser crumbs, cream fragments and face, yellow eyes, jagged navy mouth, vermilion wisps and clawed limbs, thick navy outlines, paper and letterpress texture. Pure flat solid chroma green #00ff00 background, no floor or shadows. No green in subject. No text, letters, numerals, checkmarks or symbols anywhere.
Subject: Keshikasu in a cozy chair whispering helpful guidance into the ear of a worried creature across a desk.

## 単語の絵：c2-108

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser-shavings creature with rounded blue-gray layered crumb body, cream face, yellow eyes, jagged navy mouth, dark navy outlines, cream fragments and vermilion curls. Paper and letterpress ink printmaking, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols.
Subject: Keshikasu turning an empty bottle and can into a new object, bins beside it.

## 単語の絵：c2-064

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached Keshikasu character exactly: eraser-shaving creature, blue-gray textured round body, cream fragments and claws, red wisps, yellow eyes and dark jagged mouth. Paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: Keshikasu reading a thick instruction booklet and pointing at a diagram on a board to explain how a machine works.

## 単語の絵：c2-150

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser debris creature, gray-blue craggy round body, cream face and claws, yellow eyes, dark navy jagged mouth, red wisps, paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: stationery: Keshikasu surrounded by pencils, scissors, tape and notebooks on a desk.

## 単語の絵：c2-109

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser-shavings creature with rounded blue-gray layered crumb body, cream face, yellow eyes, jagged navy mouth, dark navy outlines, cream fragments and vermilion curls. Paper and letterpress ink printmaking, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols.
Subject: Keshikasu lifting dumbbells in a gym, sweating with a towel, muscles.

## 単語の絵：c2-020

Use case: illustration-story. Game enemy illustration, full-body Keshikasu centered large in square composition. Match attached character: round blue-gray eraser crumbs, cream fragments and face, yellow eyes, jagged navy mouth, vermilion wisps and clawed limbs, thick navy outlines, paper and letterpress texture. Pure flat solid chroma green #00ff00 background, no floor or shadows. No green in subject. No text, letters, numerals, arrows, diagrams or symbols anywhere.
Subject: Keshikasu wearing a whistle and sweatband physically coaching two smaller creatures, demonstrating a stretching exercise to them.

## 単語の絵：c2-065

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached Keshikasu character exactly: eraser-shaving creature, blue-gray textured round body, cream fragments and claws, red wisps, yellow eyes and dark jagged mouth. Paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: Keshikasu driving a shiny car into a small garage shed beside a house, door rolling open.

## 単語の絵：c2-110

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser-shavings creature with rounded blue-gray layered crumb body, cream face, yellow eyes, jagged navy mouth, dark navy outlines, cream fragments and vermilion curls. Paper and letterpress ink printmaking, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols.
Subject: Keshikasu kicking a ball into a goal net with one foot while swinging a bat at a small ball.

## 単語の絵：c2-021

Use case: illustration-story. Game enemy illustration, full-body Keshikasu centered large in square composition. Match attached character: round blue-gray eraser crumbs, cream fragments and face, yellow eyes, jagged navy mouth, vermilion wisps and clawed limbs, thick navy outlines, paper and letterpress texture. Pure flat solid chroma green #00ff00 background, no floor or shadows. No green in subject. No text, letters, numerals, arrows or symbols anywhere.
Subject: Keshikasu in an oversized uniform following behind an expert, carefully copying how a task is done, eager beginner.

## 単語の絵：c2-151

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser debris creature, gray-blue craggy round body, cream face and claws, yellow eyes, dark navy jagged mouth, red wisps, paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: authorize: Keshikasu pressing a big stamp onto a blank paper, giving permission, a seal glowing.

## 単語の絵：c2-066

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached Keshikasu character exactly: eraser-shaving creature, blue-gray textured round body, cream fragments and claws, red wisps, yellow eyes and dark jagged mouth. Paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: Keshikasu reaching out and receiving a shiny item into its hands, delighted to get it at last.

## 単語の絵：c2-111

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser-shavings creature with rounded blue-gray layered crumb body, cream face, yellow eyes, jagged navy mouth, dark navy outlines, cream fragments and vermilion curls. Paper and letterpress ink printmaking, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols.
Subject: Keshikasu in front of a huge oval hall with a stage and rows of cheering seats around it.

## 単語の絵：c2-022

Use case: illustration-story. Game enemy illustration, full-body Keshikasu centered large in square composition. Match attached character: round blue-gray eraser crumbs, cream fragments and face, yellow eyes, jagged navy mouth, vermilion wisps and clawed limbs, thick navy outlines, paper and letterpress texture. Pure flat solid chroma green #00ff00 background, no floor or shadows. No green in subject. No text, letters, numerals, arrows or symbols anywhere.
Subject: Keshikasu handing plain unmarked coins back across a counter to a customer who is returning a product box.

## 単語の絵：c2-152

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser debris creature, gray-blue craggy round body, cream face and claws, yellow eyes, dark navy jagged mouth, red wisps, paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: authority: Keshikasu in a uniform with a badge holding up a hand to direct crowds with an official look.

## 単語の絵：c2-067

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached Keshikasu character exactly: eraser-shaving creature, blue-gray textured round body, cream fragments and claws, red wisps, yellow eyes and dark jagged mouth. Paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: Keshikasu holding a perfectly egg-shaped mirror, its own body round like an egg, smooth curves.

## 単語の絵：c2-112

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser-shavings creature with rounded blue-gray layered crumb body, cream face, yellow eyes, jagged navy mouth, dark navy outlines, cream fragments and vermilion curls. Paper and letterpress ink printmaking, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols.
Subject: Keshikasu in a fancy hall at a long dinner table with many creatures toasting glasses, a grand feast.

## 単語の絵：c2-153

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser debris creature, gray-blue craggy round body, cream face and claws, yellow eyes, dark navy jagged mouth, red wisps, paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: commonly: Keshikasu in a crowd where everyone is doing the same ordinary thing, usual and everywhere.

## 単語の絵：c2-023

Use case: illustration-story. Game enemy illustration, full-body Keshikasu centered large in square composition. Match attached character: round blue-gray eraser crumbs, cream fragments and face, yellow eyes, jagged navy mouth, vermilion wisps and clawed limbs, thick navy outlines, paper and letterpress texture. Pure flat solid chroma green #00ff00 background, no floor or shadows. No green in subject. No text, letters, numerals, arrows or symbols anywhere.
Subject: Keshikasu surrounded by shelves full of neat boxes, bottles and toys, merchant presenting items for sale.

## 単語の絵：c2-113

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser-shavings creature with rounded blue-gray layered crumb body, cream face, yellow eyes, jagged navy mouth, dark navy outlines, cream fragments and vermilion curls. Paper and letterpress ink printmaking, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols.
Subject: two look-alike Keshikasu side by side, a decoy fooling a confused third creature scratching its head.

## 単語の絵：c2-068

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached Keshikasu character exactly: eraser-shaving creature, blue-gray textured round body, cream fragments and claws, red wisps, yellow eyes and dark jagged mouth. Paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: Keshikasu camping on a hill with a tent and sitting on a blanket with a basket of food under open sky.

## 単語の絵：c2-154

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser debris creature, gray-blue craggy round body, cream face and claws, yellow eyes, dark navy jagged mouth, red wisps, paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: accommodate: Keshikasu squeezing many guests and beds into a room, room for everyone.

## 単語の絵：c2-114

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser-shavings creature with rounded blue-gray layered crumb body, cream face, yellow eyes, jagged navy mouth, dark navy outlines, cream fragments and vermilion curls. Paper and letterpress ink printmaking, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols.
Subject: Keshikasu carrying a stack of papers in a paper folder tucked under its arm.

## 単語の絵：c2-024

Use case: illustration-story. Game enemy illustration, full-body Keshikasu centered large in square composition. Match attached character: round blue-gray eraser crumbs, cream fragments and face, yellow eyes, jagged navy mouth, vermilion wisps and clawed limbs, thick navy outlines, paper and letterpress texture. Pure flat solid chroma green #00ff00 background, no floor or shadows. No green in subject. Absolutely no text, letters, numerals, checkmarks, clipboards or symbols anywhere.
Subject: Keshikasu pointing with a claw at stacked plain boxes and crates, with a tiny forklift nearby.

## 単語の絵：c2-069

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached Keshikasu character exactly: eraser-shaving creature, blue-gray textured round body, cream fragments and claws, red wisps, yellow eyes and dark jagged mouth. Paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: Keshikasu sitting cozy in a warm room with a rug, curtains closed, a roof above.

## 単語の絵：c2-155

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser debris creature, gray-blue craggy round body, cream face and claws, yellow eyes, dark navy jagged mouth, red wisps, paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: annoy: tiny Keshikasu buzzing around the head of another larger Keshikasu that is gritting its teeth and annoyed.

## 単語の絵：c2-115

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser-shavings creature with rounded blue-gray layered crumb body, cream face, yellow eyes, jagged navy mouth, dark navy outlines, cream fragments and vermilion curls. Paper and letterpress ink printmaking, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols.
Subject: Keshikasu tearing the top page off a big wall calendar with a pen nearby.

## 単語の絵：c2-070

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached Keshikasu character exactly: eraser-shaving creature, blue-gray textured round body, cream fragments and claws, red wisps, yellow eyes and dark jagged mouth. Paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: Keshikasu arriving at a finish flag at the end of a long winding road, a map pin planted at the top.

## 単語の絵：c2-025

Use case: illustration-story. Game enemy illustration, full-body Keshikasu centered large in square composition. Match attached character: round blue-gray eraser crumbs, cream fragments and face, yellow eyes, jagged navy mouth, vermilion wisps and clawed limbs, thick navy outlines, paper and letterpress texture. Pure flat solid chroma green #00ff00 background, no floor or shadows. No green in subject. No text, letters, numerals, arrows or symbols anywhere.
Subject: Keshikasu guiding a small group of creatures sitting around a table, all trying a hands-on pottery task together.

## 単語の絵：c2-116

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser-shavings creature with rounded blue-gray layered crumb body, cream face, yellow eyes, jagged navy mouth, dark navy outlines, cream fragments and vermilion curls. Paper and letterpress ink printmaking, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols.
Subject: Keshikasu putting coins and clothes into a big donation box for others.

## 単語の絵：c2-156

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser debris creature, gray-blue craggy round body, cream face and claws, yellow eyes, dark navy jagged mouth, red wisps, paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: coordinate: Keshikasu as a conductor arranging others so they work together smoothly, waving a baton.

## 単語の絵：c2-071

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached Keshikasu character exactly: eraser-shaving creature, blue-gray textured round body, cream fragments and claws, red wisps, yellow eyes and dark jagged mouth. Paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: Keshikasu wearing work clothes and tools of a trade, looking proud of its job.

## 単語の絵：c2-026

Use case: illustration-story. Game enemy illustration, full-body Keshikasu centered large in square composition. Match attached character: round blue-gray eraser crumbs, cream fragments and face, yellow eyes, jagged navy mouth, vermilion wisps and clawed limbs, thick navy outlines, paper and letterpress texture. Pure flat solid chroma green #00ff00 background, no floor or shadows. No green in subject. No text, letters, numerals, arrows or symbols anywhere.
Subject: Keshikasu standing at a microphone beside a blank screen pointing with a stick in front of an audience.

## 単語の絵：c2-117

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser-shavings creature with rounded blue-gray layered crumb body, cream face, yellow eyes, jagged navy mouth, dark navy outlines, cream fragments and vermilion curls. Paper and letterpress ink printmaking, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols.
Subject: Keshikasu showing a drawing to a friend who points at parts to improve while the first nods and fixes it.

## 単語の絵：c2-157

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser debris creature, gray-blue craggy round body, cream face and claws, yellow eyes, dark navy jagged mouth, red wisps, paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: quit: Keshikasu dropping its tools, walking out of a door and waving goodbye to a job.

## 単語の絵：c2-072

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached Keshikasu character exactly: eraser-shaving creature, blue-gray textured round body, cream fragments and claws, red wisps, yellow eyes and dark jagged mouth. Paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: Keshikasu pushing a blank calendar page far ahead with both hands, putting the appointment off for later.

## 単語の絵：c2-118

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser-shavings creature with rounded blue-gray layered crumb body, cream face, yellow eyes, jagged navy mouth, dark navy outlines, cream fragments and vermilion curls. Paper and letterpress ink printmaking, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols.
Subject: Keshikasu connecting a long cable and pipe to a house, supplying water and power to a home.

## 単語の絵：c2-073

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached Keshikasu character exactly: eraser-shaving creature, blue-gray textured round body, cream fragments and claws, red wisps, yellow eyes and dark jagged mouth. Paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: two Keshikasu creatures arguing face to face, one pointing up while the other points the opposite way, shaking head.

## 単語の絵：c2-027

Use case: illustration-story. Game enemy illustration, full-body Keshikasu centered large in square composition. Match attached character: round blue-gray eraser crumbs, cream fragments and face, yellow eyes, jagged navy mouth, vermilion wisps and clawed limbs, thick navy outlines, paper and letterpress texture. Pure flat solid chroma green #00ff00 background everywhere around the isolated character and small props, no floor, no street surface, no scene backdrop or shadows. No green in subject. No text, letters, numerals, arrows or symbols anywhere.
Subject: Keshikasu walking alongside small isolated skyscraper models and a tiny car, suggesting a busy city center.

## 単語の絵：c2-158

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser debris creature, gray-blue craggy round body, cream face and claws, yellow eyes, dark navy jagged mouth, red wisps, paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: captain: Keshikasu in a captain hat at the wheel of a big plane cockpit, stripes on its shoulders.

## 単語の絵：c2-119

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser-shavings creature with rounded blue-gray layered crumb body, cream face, yellow eyes, jagged navy mouth, dark navy outlines, cream fragments and vermilion curls. Paper and letterpress ink printmaking, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols.
Subject: Keshikasu clutching a rumbling stomach, staring at a table of food with big eyes.

## 単語の絵：c2-074

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached Keshikasu character exactly: eraser-shaving creature, blue-gray textured round body, cream fragments and claws, red wisps, yellow eyes and dark jagged mouth. Paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: Keshikasu holding an open umbrella in falling rain with a gray cloud and puddles.

## 単語の絵：c2-028

Use case: illustration-story. Game enemy illustration, full-body Keshikasu centered large in square composition. Match attached character: round blue-gray eraser crumbs, cream fragments and face, yellow eyes, jagged navy mouth, vermilion wisps and clawed limbs, thick navy outlines, paper and letterpress texture. Pure flat solid chroma green #00ff00 background, no floor or shadows. No green in subject. No text, letters, numerals, arrows or symbols anywhere; clock faces blank.
Subject: Keshikasu panicking over a mountain of unfinished work with a ringing alarm clock and the last sand falling in an hourglass.

## 単語の絵：c2-120

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser-shavings creature with rounded blue-gray layered crumb body, cream face, yellow eyes, jagged navy mouth, dark navy outlines, cream fragments and vermilion curls. Paper and letterpress ink printmaking, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols.
Subject: Keshikasu licking its lips with a delighted face over a swirl of tasty flavor, steam from a plate.

## 単語の絵：c2-159

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser debris creature, gray-blue craggy round body, cream face and claws, yellow eyes, dark navy jagged mouth, red wisps, paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: installation: Keshikasu fitting a big machine into place with a wrench, bolts and a ladder.

## 単語の絵：c2-075

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached Keshikasu character exactly: eraser-shaving creature, blue-gray textured round body, cream fragments and claws, red wisps, yellow eyes and dark jagged mouth. Paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: Keshikasu enjoying a bright blue sky with a shining sun and a few light clouds, happy.

## 単語の絵：c2-029

Use case: illustration-story. Game enemy illustration, full-body Keshikasu centered large in square composition. Match attached character: round blue-gray eraser crumbs, cream fragments and face, yellow eyes, jagged navy mouth, vermilion wisps and clawed limbs, thick navy outlines, paper and letterpress texture. Pure flat solid chroma green #00ff00 background, no floor or shadows. No green in subject. No text, letters, numerals, arrows or symbols anywhere; all papers completely blank and coins unmarked.
Subject: Keshikasu at a counter handing a long blank paper to a customer while another creature holds a paper strip after paying, coins exchanging.

## 単語の絵：c2-121

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser-shavings creature with rounded blue-gray layered crumb body, cream face, yellow eyes, jagged navy mouth, dark navy outlines, cream fragments and vermilion curls. Paper and letterpress ink printmaking, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols.
Subject: Keshikasu examining goods with a magnifying glass and a flashlight, checking carefully.

## 単語の絵：c2-076

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached Keshikasu character exactly: eraser-shaving creature, blue-gray textured round body, cream fragments and claws, red wisps, yellow eyes and dark jagged mouth. Paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: Keshikasu looking up at a sky filled with thick gray clouds, sun hidden.

## 単語の絵：c2-160

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser debris creature, gray-blue craggy round body, cream face and claws, yellow eyes, dark navy jagged mouth, red wisps, paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: availability: Keshikasu at a hotel desk with many empty rooms available, keys hanging free.

## 単語の絵：c2-030

Use case: illustration-story. Game enemy illustration, full-body Keshikasu centered large in square composition. Match attached character: round blue-gray eraser crumbs, cream fragments and face, yellow eyes, jagged navy mouth, vermilion wisps and clawed limbs, thick navy outlines, paper and letterpress texture. Pure flat solid chroma green #00ff00 background, no floor or shadows. No green in subject. No text, letters, numerals, arrows or symbols anywhere; all papers completely blank.
Subject: Keshikasu holding a folded glossy leaflet and pinning blank sheets on a notice board while others read.

## 単語の絵：c2-122

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser-shavings creature with rounded blue-gray layered crumb body, cream face, yellow eyes, jagged navy mouth, dark navy outlines, cream fragments and vermilion curls. Paper and letterpress ink printmaking, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols.
Subject: Keshikasu at a front door receiving a parcel from a delivery creature, signing for it.

## 単語の絵：c2-077

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached Keshikasu character exactly: eraser-shaving creature, blue-gray textured round body, cream fragments and claws, red wisps, yellow eyes and dark jagged mouth. Paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: Keshikasu holding a small slim phone in one hand and a thin laptop folded open on its knees, glowing screens.

## 単語の絵：c2-161

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser debris creature, gray-blue craggy round body, cream face and claws, yellow eyes, dark navy jagged mouth, red wisps, paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: complimentary: Keshikasu receiving a free gift with a ribbon, no coins exchanged, a smiling host.

## 単語の絵：c2-123

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser-shavings creature with rounded blue-gray layered crumb body, cream face, yellow eyes, jagged navy mouth, dark navy outlines, cream fragments and vermilion curls. Paper and letterpress ink printmaking, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols.
Subject: two Keshikasu blending into one big Keshikasu, companies joined together.

## 単語の絵：c2-031

Use case: illustration-story. Game enemy illustration, full-body Keshikasu centered large in square composition. Match attached character: round blue-gray eraser crumbs, cream fragments and face, yellow eyes, jagged navy mouth, vermilion wisps and clawed limbs, thick navy outlines, paper and letterpress texture. Pure flat solid chroma green #00ff00 background, no floor or shadows. No green in subject. No text, letters, numerals, arrows or symbols anywhere; all papers completely blank.
Subject: Keshikasu with round glasses at a desk with an abacus, plain coins and a thick ledger book, carefully checking it with a magnifying glass.

## 単語の絵：c2-078

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached Keshikasu character exactly: eraser-shaving creature, blue-gray textured round body, cream fragments and claws, red wisps, yellow eyes and dark jagged mouth. Paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: Keshikasu typing on a large flat keyboard with its many fingers, keys clicking.

## 単語の絵：c2-032

Use case: illustration-story. Game enemy illustration, full-body Keshikasu centered large in square composition. Match attached character: round blue-gray eraser crumbs, cream fragments and face, yellow eyes, jagged navy mouth, vermilion wisps and clawed limbs, thick navy outlines, paper and letterpress texture. Pure flat solid chroma green #00ff00 background, no floor or shadows. No green in subject. No text, letters, numerals, arrows or symbols anywhere; coins unmarked.
Subject: Keshikasu and another creature swapping a sack of coins for a wrapped box, a handshake in the middle.

## 単語の絵：c2-124

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser-shavings creature with rounded blue-gray layered crumb body, cream face, yellow eyes, jagged navy mouth, dark navy outlines, cream fragments and vermilion curls. Paper and letterpress ink printmaking, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols.
Subject: Keshikasu following a cooking guide, putting eggs, flour, milk and tomatoes into a mixing bowl, a cookbook open.

## 単語の絵：c2-162

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser debris creature, gray-blue craggy round body, cream face and claws, yellow eyes, dark navy jagged mouth, red wisps, paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: hike: Keshikasu staring at a blank price tag climbing up a ladder very high, shocked shoppers.

## 単語の絵：c2-079

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached Keshikasu character exactly: eraser-shaving creature, blue-gray textured round body, cream fragments and claws, red wisps, yellow eyes and dark jagged mouth. Paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: Keshikasu holding a small, neatly folded, tiny version of a gadget, everything tiny and light.

## 単語の絵：c2-125

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser-shavings creature with rounded blue-gray layered crumb body, cream face, yellow eyes, jagged navy mouth, dark navy outlines, cream fragments and vermilion curls. Paper and letterpress ink printmaking, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or other symbols.
Subject: Keshikasu erasing a paragraph of squiggles and writing it again with a pencil, crumpled paper.

## 単語の絵：c2-033

Use case: illustration-story. Game enemy illustration, full-body Keshikasu centered large in square composition. Match attached character: round blue-gray eraser crumbs, cream fragments and face, yellow eyes, jagged navy mouth, vermilion wisps and clawed limbs, thick navy outlines, paper and letterpress texture. Pure flat solid chroma green #00ff00 background, no floor or shadows. No green in subject. No text, letters, numerals, arrows or symbols anywhere.
Subject: Keshikasu in a neat uniform behind a front counter with a small bell, welcoming a guest and handing over a bag and a key.

## 単語の絵：c2-080

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached Keshikasu character exactly: eraser-shaving creature, blue-gray textured round body, cream fragments and claws, red wisps, yellow eyes and dark jagged mouth. Paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains, slightly cute spooky monster. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: Keshikasu in a mask with a small mirror and tool looking into a patient's big open mouth full of teeth.

## 単語の絵：c2-163

Use case: illustration-story. Game enemy illustration, one full-body monster centered large in square composition. Match the attached reference character Keshikasu precisely: eraser debris creature, gray-blue craggy round body, cream face and claws, yellow eyes, dark navy jagged mouth, red wisps, paper and letterpress ink printmaking, thick dark navy outlines, flat discrete color shapes, textured paper and ink stains. Palette primarily navy #1f2a44, mist #9fb3bf, paper #f3ead8, a little vermilion #c8462f. Make the meaning instantly recognizable through oversized clear motifs. Pure flat solid chroma green #00ff00 background, no shadows, no ground, no pattern. No green in the subject. No text, letters, numerals or symbols.
Subject: productivity: Keshikasu at a fast assembly line producing many items quickly, a pile of goods.
