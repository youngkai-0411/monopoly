# Tỷ Phú Việt Nam — 3D Visual Reference

Ngày audit: 04/10/2026. Baseline production: `2019a796667e7b52fa2df7c1cca350f6c1a5bede`. **Audit current state — không sửa production source, không thiết kế 3D Palette V2.**

Phạm vi chính: gameplay `/`, `App → Board → ThreeBoard → TabletopScene → TabletopArt`. `?graphics=1` dùng cùng scene/art nhưng không có immersive framing của gameplay; `?graphics=2` là Pixi 2.5D, palette riêng, không được gộp vào các bảng 3D bên dưới. DOM ClassicBoard chỉ là fallback.

Các HEX trong tài liệu là **màu input/base/texture**, không phải lời khẳng định pixel cuối của mesh có cùng HEX. Các mục “Observation” là nhận xét từ source và ảnh; defaults ghi rõ nguồn Three.js local **0.186.1 / r186**. Những category không hiện hữu ghi “Not currently implemented.”

Phương pháp: source inspection + local dependency defaults + đọc runtime một scene TabletopScene tạm, dùng constructor hiện có, ngoài viewport, sau đó destroy; không gắn debug API vào app và không thay scene gameplay. Ảnh chụp Chrome **154.0.8037.97**, touch/mobile emulation, DPR browser 2, renderer DPR 1.5. Không phải Android/iPhone/Safari thật. Tooling tạm được dọn sau audit.

## 1. Renderer

Nguồn: [tabletopScene.ts](src/rendering/tabletopScene.ts), `TabletopScene.constructor/resize/draw`; [ThreeBoard.tsx](src/components/ThreeBoard.tsx), effect mount/resize/context-loss.

| Setting | Current value | App-set / default / evidence |
| --- | --- | --- |
| Renderer | THREE.WebGLRenderer, WebGL 2 | Constructor; dependency không hỗ trợ WebGL 1 |
| antialias | true | App set; runtime context cũng true |
| alpha option | false | App set; clear background opaque |
| Native context alpha | true | Runtime; Three r186 tạo context với alpha:true, còn constructor alpha điều khiển default clear alpha. Không diễn giải alpha:false thành “context không có alpha channel” |
| powerPreference | low-power | App set; runtime context low-power; đây là hint, không chứng minh GPU tiết kiệm điện |
| pixelRatio | min(devicePixelRatio || 1, 1.5) | App set; runtime 1.5 khi browser DPR 2 |
| outputColorSpace | SRGBColorSpace / srgb | App set |
| toneMapping | NoToneMapping / 0 | **Uses Three.js default value**, runtime 0 |
| toneMappingExposure | 1.0 | **Uses Three.js default value**, runtime 1 |
| Clear color | #B4DED7 | UI_COLORS.game-bg; setClearColor; runtime getClearColor |
| Clear alpha | 1 | Default alpha argument của setClearColor; app không set transparent clear |
| depth / stencil | true / false | **Uses Three.js default value**; runtime xác nhận |
| premultipliedAlpha | true | **Uses Three.js default value**; runtime xác nhận |
| preserveDrawingBuffer | false | **Uses Three.js default value**; runtime xác nhận |
| physicallyCorrectLights / useLegacyLights | Not applicable | Không có config app; các option/property tên này không có trong WebGLRenderer local đang dùng |
| Scene.background | null | Không set; runtime null; nền đến từ clear color và ground mesh |
| Scene.environment / fog | null / null | Không set; runtime null |
| Post-processing/custom shader | Not currently implemented | Không có composer, project ShaderMaterial hoặc custom tone mapping |

Tại viewport CSS **852×393**, host gameplay **836×333**, drawing buffer **1254×499**. Drawing buffer làm tròn phần lẻ của height×1.5; không phải atlas tự resize theo DPR. Tại **932×430**, host **916×370**, buffer **1374×555**.

Renderer render theo requestAnimationFrame khi có thay đổi/movement/camera/dice; dừng khi settle hoặc document hidden. Scene dùng instancing cho tile bodies và scenery lặp; không dùng engine/game logic để render thêm frames. Không bổ sung LOD trong audit.

Defaults source: [WebGLRenderer.js](node_modules/three/src/renderers/WebGLRenderer.js), constructor và getContext block; toneMapping/exposure tại lines 277/285, context alpha tại line 389; `WebGLBackground`/setClearColor xử lý clear alpha.

## 2. Lighting

Nguồn: `TabletopScene.constructor` và WORLD.light trong [tokens.ts](src/visual/tokens.ts).

| Type | Color | Intensity | Position / target | Cast shadow |
| --- | --- | ---: | --- | --- |
| HemisphereLight | sky #FFF8E1, ground #629D88 | 2.3 | Position (0,1,0), dependency default; không điều chỉnh bởi app | false, default |
| DirectionalLight | #FFF6DF | 2.0 | App position (-8,16,9); target (0,0,0), default | false, default |
| AmbientLight | — | — | Not currently implemented | — |
| PointLight / SpotLight / RectAreaLight | — | — | Not currently implemented | — |

Lights cố định, không đổi theo lượt, giờ/ngày hoặc weather. Không có environment map/HDR lighting. Không có emissive illumination.

**Observation:** Lambert world faces sáng/nhạt khác base HEX; nhóm đất in trên Basic atlas giữ màu mạnh hơn vì không chịu hai lights. Ảnh có chất pastel sáng và phân mặt low-poly. Chưa có đo clipping hoặc benchmark màn hình thiết bị thật; không kết luận mọi bề mặt bị overexposure chỉ từ intensity.

## 3. Shadows

### Shadow maps

| Setting | Current value | Status |
| --- | --- | --- |
| renderer.shadowMap.enabled | false | **Uses Three.js default value**; runtime xác nhận |
| renderer.shadowMap.type | PCFShadowMap / 1 | **Uses Three.js default value**; dormant vì disabled |
| Directional castShadow | false | **Uses Three.js default value** |
| Shadow map size | 512×512 | Default, không được app cấu hình, không render shadow map |
| Shadow camera | left -5, right 5, top 5, bottom -5, near .5, far 500 | Default DirectionalLightShadow, dormant |
| bias / normalBias / radius | 0 / 0 / 1 | Default, dormant |
| Mesh castShadow / receiveShadow | false / false | App không set; runtime scene audit có **0 objects cast**, **0 objects receive** |

Nguồn defaults: [WebGLShadowMap.js](node_modules/three/src/renderers/webgl/WebGLShadowMap.js), lines 84/89; [DirectionalLightShadow.js](node_modules/three/src/lights/DirectionalLightShadow.js), constructor; [LightShadow.js](node_modules/three/src/lights/LightShadow.js); [Object3D.js](node_modules/three/src/core/Object3D.js), lines 299/307.

### Bóng giả/contact blobs

`TabletopArt.constructor/shadow()` tạo CanvasTexture **64×64**, radial gradient (32,32,r=4) → (32,32,r=30):

- Center **#21443B65**: RGB (33,68,59), alpha 101/255 ≈ .396.
- Edge **#21443B00**: cùng RGB, alpha 0.
- Material **MeshBasicMaterial**, map sRGB, transparent:true, depthWrite:false; opacity **1, default**, alpha thực nằm trong texture.
- PlaneGeometry 1×1, rotation X=-π/2, local y=.01; width/depth được scale.
- Pawn shadow width .65, house .9, landmark .95, tree 1.1, pavilion 1.8; parent scale tiếp tục tác động.
- Shared shadow material/geometry. Transparent planes không bị batchScenery gộp.

Đây không phải bóng do sun đổ, không thay hướng theo light và không occlude các objects khác. Renderer không tạo shadow maps cho terrain, tile, building, token hoặc dice.

## 4. Color Management

| Stage | Current behavior | Source |
| --- | --- | --- |
| CSS/Canvas color inputs | HEX/CSS sRGB inputs | tokens, boardPrinting, canvas gradient/dice |
| THREE.Color HEX/CSS input | Converts sRGB input sang working color space khi ColorManagement enabled | local Color.js.setHex/setStyle |
| ColorManagement.enabled | true, app không override | **Uses Three.js default value**, local/runtime |
| Working space | LinearSRGBColorSpace / srgb-linear | **Uses Three.js default value** |
| CanvasTexture maps | Explicit SRGBColorSpace | tabletopArt.canvasTexture |
| Mesh output | Renderer SRGBColorSpace | tabletopScene constructor |
| Tone mapping | NoToneMapping; exposure 1 | Default, runtime |
| Atlas shading | MeshBasicMaterial, unlit | boardPrinting |
| World models / dice | MeshLambertMaterial, lit | art factory / diceMaterials |

Cùng HEX player ở HUD (CSS), ownership/roof/pawn (Lambert) có thể nhìn khác do light/normal, texture filtering, compositing hoặc projection; source không dùng biến thể player HEX khác nhau để gây khác biệt đó.

Không thấy project tự disable ColorManagement, ép linear cho atlas, custom shader conversion hoặc post-process. Canvas/Three cùng sRGB input/output nhưng **lighting path khác nhau**: atlas unlit, body/model lit. Đây là observation về render path, không kết luận gamma pipeline lỗi.

Nguồn dependency: [ColorManagement.js](node_modules/three/src/math/ColorManagement.js), enabled/working defaults; [Color.js](node_modules/three/src/math/Color.js), setHex/setStyle; [Texture.js](node_modules/three/src/textures/Texture.js); [CanvasTexture.js](node_modules/three/src/textures/CanvasTexture.js).

## 5. Environment Palette

### Global 3D Palette

Bảng này liệt kê các màu chính; bảng environment/board/building/landmark/player phía dưới ghi đầy đủ parts và usage. `WORLD.*` đều định nghĩa tại [tokens.ts](src/visual/tokens.ts), consumer mới xác định chúng có đang được dùng.

| Element | Color | Source | Notes |
| --- | --- | --- | --- |
| Background / world ground | #B4DED7 | UI_COLORS.game-bg; TabletopScene.constructor/environment | Clear color và một Lambert ground mesh cùng input |
| Grass / rim / leaves | #8BC678, #8AB978, #50A76D, #7AC783 | WORLD.environment / tree; environment/tree() | Không phải player green |
| Stone / board support / trim / joints | #BEAA86, #D5C9AB, #FFF3CD, #AA977A, #D9CCAA | WORLD.environment; environment() | Raised island, stone layers, seams, stairs |
| Path / courtyard | #E6CF99 | WORLD.environment.path; environment() | Four paved strips, không có road network |
| Water / fountain | #72BCC7, #97D5DD, #E8D6AB, #E2D6B9, #EEE3C8 | WORLD.environment; environment() | Static opaque low-poly fountain |
| Bench | #A67855, #B88761, #5D7367 | WORLD.environment; environment() | Seat, back, legs |
| Pavilion | #D9C89C, #D99D60, #7EAE92, #3F9293, #55AAAA, #F4CD72 | WORLD.pavilion; pavilion() | Base/posts/wall/two roofs/cap |
| Card stacks | #6BAEB7, #EEAA78, #FFF6DD, #FFEEC5 | WORLD.environment; environment() | Decorative deck stacks/insets |
| Tile body / printed backgrounds / border | #F0E9CF, #FFF6DF, #D8EDCB, #FBE0EB, #E1EBEB, #A9B69E | WORLD.tile; constructor/boardPrinting | Body lit; print unlit |
| Printed text / price / symbols | #254B4C, #48675E, #407171, #33636C, #617DAD | WORLD.tile; boardPrinting | UI text colors shared; rail/utility glyph colors |
| Property groups | #8B5A2B, #87CEEB, #D95AA5, #F59E0B, #DC2626, #FACC15, #16A34A, #1D4ED8 | Manifest → GROUPS → boardPrinting | In atlas band, không tint toàn tile |
| Player identity | #EE6B73, #59BAFA, #73D7A0, #FFD46A | PLAYER_COLORS; pawn/setGame/PlayerIndicator | Body/owner/house roofs, HUD |
| House/hotel parts | #FFE6B3, #CC5B4C, #3D6C79, #477D8C, #735A4D, #F6C959 + owner roof color | WORLD.house; house() | Hotel roof cố định |
| Landmark parts | Xem section 11, 14 HEX cụ thể | WORLD.landmark; landmark() | Ga, jail, điện, nước |
| Pawn neutral/accessory parts | #384D58, #F6C69E, #3B4145, #FFE3A0, #44564B, #F2C957, #FFE176 | WORLD.pawn; pawn() | Shoes, skin, eyes, hat/hair |
| Dice | #FFF8E0, #335164 | WORLD.dice; diceMaterials() | Six 64px maps, Lambert |
| Focus | #285D59, #D49422 | WORLD.focus.active/destination | Basic ring và LineBasic outline |
| Light colors | #FFF8E1, #629D88, #FFF6DF | WORLD.light; constructor | Sky/ground/sun |
| Blob shadow | #21443B65 → #21443B00 | WORLD.shadow; TabletopArt constructor | Alpha gradient, không material opacity=.396 |

### Ground, water, nature và props

**Material mặc định trong bảng:** L = `TabletopArt.material` → MeshLambertMaterial({color,flatShading:true}); opacity **1, Uses Three.js default value**, transparent:false. Mỗi dòng ghi material rõ để không nhầm water có transparency.

| Element | HEX | Material / opacity | Usage | Source |
| --- | --- | --- | --- | --- |
| World ground | #B4DED7 | L / 1 default | Box 100×.15×100 ở y=-1.27 | environment(), UI_COLORS.game-bg |
| Island stone side | #BEAA86 | L / 1 default | 15.3×.68×13.3, y=-.92 | environment(), stone |
| Grass rim | #8AB978 | L / 1 default | 15.5×.14×13.5, y=-.56 | environment(), grassRim |
| Raised stone top | #D5C9AB | L / 1 default | 12.55×.40×10.6, y=-.33 | environment(), stoneTop |
| Pale rim/trim | #FFF3CD | L / 1 default | 12.4×.13×10.45, y=-.08 | environment(), rim |
| Central grass | #8BC678 | L / 1 default | 8.95×.15×7.95, y=.05 | environment(), grass |
| Paved path | #E6CF99 | L / 1 default | Four strips at ±3.60; y=.145 | environment(), path |
| Block joints | #AA977A | L / 1 default | Seams at x/z ±7.66, y=-.89 | environment(), joint |
| Stairs | #D9CCAA | L / 1 default | Four steps on two sides | environment(), stairs |
| Tree trunk | #987953 | L / 1 default | Cylinder radius .07, height .72 | TabletopArt.tree |
| Tree foliage dark/light | #50A76D / #7AC783 | L / 1 default | Two Icosahedron-based crowns | tree(); 8 trees, parent scale .8 |
| Fountain base | #E8D6AB | L / 1 default | Radius1.14, height .10 | environment(), fountain |
| Fountain water disk | #72BCC7 | L / 1 default, opaque | Radius1.02, height .045 | environment(), water |
| Fountain pillar | #E2D6B9 | L / 1 default | Radius .17, height .32 | environment(), pillar |
| Fountain bowl | #EEE3C8 | L / 1 default | Radius .36, height .08 | environment(), bowl |
| Fountain drop | #97D5DD | L / 1 default, opaque | Low-poly ellipsoid at y=.77 | environment(), drop |
| Bench seat/back/legs | #A67855 / #B88761 / #5D7367 | L / 1 default | Two benches | environment(), bench* |
| Chance/life top card | #6BAEB7 / #EEAA78 | L / 1 default | Top slab of three-layer stack | environment(), chanceCard/lifeCard |
| Card paper / inset | #FFF6DD / #FFEEC5 | L / 1 default | Lower stack layers, inset | environment(), cardPaper/cardInset |
| Pavilion base/posts/wall | #D9C89C / #D99D60 / #7EAE92 | L / 1 default | Four corner pavilions | pavilion() |
| Pavilion roofs/cap | #3F9293 / #55AAAA / #F4CD72 | L / 1 default | Two pyramid roofs + cap | pavilion() |

Background/fog: scene background/fog **Not currently implemented** as objects; renderer clear and ground mesh có tồn tại. Dirt, sand, separate pavement material, road network, bushes, independent decorative plants, rocks, lamps, signs: **Not currently implemented**. Path/paving có cùng strip màu nêu trên; không tự tạo “road palette”. Benches, fountain, cards, pavilions, stairs có implement. River, sea, animated/refraction/transparent water: **Not currently implemented**. Water-tank landmark xem section 11.

**Observation:** environment phần lớn calm, nhiều cream/green/teal. Một số joint lines đứng rời phía ngoài island nhìn rõ trong ảnh A/F; `z=±7.66` vượt half-depth 6.65 của stone-side box. Ghi nhận hiện trạng geometry này, chưa sửa.

## 6. Board Palette

| Element | Input color | Material / opacity | Usage / source |
| --- | --- | --- | --- |
| Base board/support/side | #BEAA86 / #D5C9AB | Lambert / 1 default | Shared raised-island layers của environment; không có material “boardBase” riêng |
| Board trim | #FFF3CD | Lambert / 1 default | environment.rim |
| Tile body + sides | #F0E9CF | Lambert / 1 default | Instanced BoxGeometry(1,.14,1), 40 instances; scale width-.03/depth-.03, center y=.08 |
| Property print paper | #FFF6DF | Basic atlas / 1 default | Tất cả LAND, RAILROAD, UTILITY đều paper, không tint theo group |
| START print | #D8EDCB | Basic atlas / 1 default | START branch |
| LIFE print | #FBE0EB | Basic atlas / 1 default | 3 LIFE tiles |
| Other special/corner print | #E1EBEB | Basic atlas / 1 default | CHANCE/TAX/JAIL/REST/GO_TO_JAIL dùng cùng background |
| Printed tile border | #A9B69E | Basic atlas / 1 default | Canvas stroke 3 logical px, strokeRect inset 2 |
| Name / price | #254B4C / #48675E | Basic atlas / 1 default | Printed font |
| Special symbol | #407171 | Basic atlas / 1 default | START arrow, chance ?, life heart, tax −, jail ▥, rest sun, go-to-jail arrow |
| Railroad / utility glyph | #33636C / #617DAD | Basic atlas / 1 default | Railroad ▰ / utility ◇ |
| Group band | 8 manifest colors | Basic atlas / 1 default | LAND branch fillRect(3,3,122,25) |
| Board paths/road between tiles | Not currently implemented | — | Courtyard path là environment, không route giữa tiles |

Board geometry từ manifest: outer 12.2; 9 normal tiles giữa corners; corners 1.6×1.6; normal footprints 1×1.6 hoặc 1.6×1 tùy side. Printed surfaces inset .055 và y=.155; body top y=.15. Corner paper không có palette riêng theo từng góc ngoài START.

**Observation:** board tách khỏi grass bởi paper/light-special faces, raised edges và color band; có separation đủ để nhận layout ở overview. Tile-body/stone/trim có sắc gần nhau nên side geometry mềm. Text/detail ở far không đủ đọc, nhưng far requirement không yêu cầu đọc tên. Ở follow, text upside-down/rotated ở các cạnh vẫn cần context; models/pawn có thể che chữ.

## 7. Property Group Palette

Nguồn chính: [classic-vietnam-v2.json](docs/classic-vietnam-v2.json) `groups` → [groups.ts](src/game/data/groups.ts) `GROUPS` → `boardPrinting` group lookup.

| Group | Current color | 3D usage | UI usage |
| --- | --- | --- | --- |
| Miền Tây | #8B5A2B | LAND printed band | Detail badge/asset heading; DOM fallback band |
| Phương Nam | #87CEEB | LAND printed band | Same channels |
| Cao Nguyên | #D95AA5 | LAND printed band | Same channels |
| Duyên Hải | #F59E0B | LAND printed band | Same channels |
| Di Sản | #DC2626 | LAND printed band | Same channels |
| Miền Trung Bắc | #FACC15 | LAND printed band | Same channels |
| Miền Bắc | #16A34A | LAND printed band | Same channels |
| Đô Thị | #1D4ED8 | LAND printed band | Same channels |

3D: **strip nằm trong atlas texture**, không dùng group color cho body, border, name/price, house walls/roofs hoặc token. Generic roofs dùng **owner player color**, hotel roof cố định. Main entry truyền group colors vào CSS variables cho fallback; GameOverlay detail badge và asset-group headings dùng group.color trực tiếp.

Pixi `sceneArt.GROUP_COLORS` có một số HEX khác (Phương Nam/Duyên Hải/Đô Thị); đây là prototype khác, không phải màu của gameplay Three. Không thay hoặc “đồng bộ” nó trong audit.

## 8. Player Palette

| Player | Color | Token | HUD | Ownership |
| --- | --- | --- | --- | --- |
| Player 1 | #EE6B73 | ✓ body; nón lá riêng | ✓ indicator | ✓ strip; house roof |
| Player 2 | #59BAFA | ✓ body + cap/brim | ✓ indicator | ✓ strip; house roof |
| Player 3 | #73D7A0 | ✓ body; dark hair riêng | ✓ indicator | ✓ strip; house roof |
| Player 4 | #FFD46A | ✓ body; yellow hat riêng | ✓ indicator | ✓ strip; house roof |

Một mảng `PLAYER_COLORS` trong tokens.ts; format.ts re-export. TabletopScene.setGame chọn theo **index trong game.players**, không hash playerId. PlayerIndicator, ClassicBoard và shared prototypes cũng dùng mảng đó.

Không tìm thấy biến thể body/ownership HEX khác cho cùng player trong gameplay 3D. Roof nhà Lv.1–Lv.4 dùng đúng owner HEX; Lv.5 chuyển sang **#CC5B4C** chung cho mọi owner. Đây là hotel style, owner strip vẫn giữ player HEX.

### Token parts và material

| Part | Input color | Usage |
| --- | --- | --- |
| Shoes | #384D58 | Two boxes |
| Skin | #F6C69E | Head + hands |
| Eyes | #3B4145 | Two small spheres |
| Player 1 conical hat | #FFE3A0 | ConeGeometry(.29,.20,12), local y=.88 |
| Player 2 cap/brim | #59BAFA | Cùng player color |
| Player 3 hair | #44564B | Crown + bun |
| Player 4 hat rim / crown | #F2C957 / #FFE176 | Hai cylinders, không dùng #FFD46A cho hat |

Factory `TabletopArt.pawn(color,index)` dùng Lambert material pool, flatShading:true. Roughness/metalness **not applicable**; emissive #000000 và emissiveIntensity 1, **Uses Three.js default value**, không glow. Opacity 1 / transparent false / depthTest+depthWrite true, **defaults**. Shadow là shared blob .65 local, không castShadow. Node scale **.75**, parent position y=.18, facing đổi theo hướng di chuyển.

Body box .27×.39×.20, head ellipsoid .17/.18/.16; placement offsets quanh tile center: x ±.09, z -.08 hoặc +.10 theo player index. Các offsets nhỏ nên nhiều player cùng tile vẫn có thể che nhau. Material pool shared theo input color; không có riêng “token PBR factory”.

## 9. Ownership Visualization

**Type:** colored 3D box strip + dark teal outline box; thêm house roof color khi Lv.1–Lv.4. Không flag/ring owner riêng, không tint toàn paper.

| Attribute | Current value |
| --- | --- |
| Color source | PLAYER_COLORS[owner index] |
| Material | Lambert pool / flatShading:true / opaque, opacity 1 default |
| Strip dimensions | (tile.width-.15) × .032 × .12 world units |
| Strip center | (point.x, .172, point.z + point.depth/2 - .07) |
| Outline dimensions | (tile.width-.10) × .022 × .16 |
| Outline center | Same x/z, y=.159 |
| Outline color | #285D59, WORLD.focus.active |
| Visibility | Tạo khi property.ownerId có giá trị; LAND/RAILROAD/UTILITY đều có |
| Update | ownerId/level signature trong setGame; batchScenery(houses) |
| Source | tabletopScene.ts, setGame |

Far: nhận ra một strip nhỏ có owner, nhưng gán owner chính xác khó hơn follow, nhất là khi owner color gần group band. Medium: strip/outline rõ hơn trên paper. Close: không có camera close riêng; context/detail cho owner name và controlled indicator.

### Group vs owner channels

Logical channels khác nhau: **group → atlas band; owner → mesh strip**. Ownership không thay group value, paper hoặc font.

Tuy nhiên **spatial separation không đồng nhất**: strip luôn đặt ở cạnh **+Z**, không rotate theo tile.side. Atlas band rotate theo bottom:0 / left:1 / top:2 / right:3. Ở cạnh top, group band nằm về +Z và owner strip đè lên phần cùng mép band. [Ảnh owned top](docs/task3-owned-top-mobile.png) cho thấy strip xanh trên band vàng. Ở left/right, strip nằm tại cạnh tangential +Z thay vì tương đương mép outer/inner của bottom. Đây là conflict layout của hai channel, không phải hai HEX bị trộn trong data.

Hotel không còn roof theo owner nên owner phải nhận qua strip hoặc context. Không có owner flag mới hoặc cải tiến placement trong audit.

## 10. Building Palette

Nguồn: WORLD.house và `TabletopArt.house(level,color)`.

| Part | HEX | Material / opacity | Notes |
| --- | --- | --- | --- |
| Wall | #FFE6B3 | Lambert / 1 default | House và hotel dùng chung |
| Roof houses | Owner HEX | Lambert / 1 default | Lv.1–Lv.4 |
| Hotel roof | #CC5B4C | Lambert / 1 default | Lv.5, không owner tint |
| Door | #3D6C79 | Lambert / 1 default | Front thin box |
| Window | #477D8C | Lambert / 1 default | Side thin boxes |
| Hotel flag pole | #735A4D | Lambert / 1 default | Lv.5 |
| Hotel flag | #F6C959 | Lambert / 1 default | Lv.5 |
| Independent foundation model | Not currently implemented | — | Wall begins at local y=0; blob shadow bên dưới |

Geometry low-poly primitives shared: BoxGeometry; pyramid roof ConeGeometry(1,1,4), y rotation π/4. Không có bevel texture, normal map, metallic/roughness map, baked AO, emissive windows hoặc animated doors.

Pavilion không phải upgrade model: base #D9C89C, posts #D99D60, wall #7EAE92, roofs #3F9293/#55AAAA, cap #F4CD72. Bench và card stack xem environment. Không có random/procedural hue generation; palette cố định, owner roof là parameter.

## 11. Landmark Palette

`TabletopArt.landmark(kind,water)` là factory procedural **geometry**, palette cố định theo kind. TabletopScene constructor chỉ tạo model cho tile types **RAILROAD / UTILITY / JAIL**; water branch khi propertyId===cap-nuoc. Tất cả ga dùng cùng model/colors, không có palette riêng theo từng ga. Model node scale **.66**.

| Model / part | HEX | Material / opacity |
| --- | --- | --- |
| Railroad base | #D7BB85 | Lambert / 1 default |
| Railroad wall | #F4DFB5 | Lambert / 1 default |
| Railroad roof | #397D86 | Lambert / 1 default |
| Railroad windows | #416477 | Lambert / 1 default |
| Jail wall | #D7D4C7 | Lambert / 1 default |
| Jail bars | #48616B | Lambert / 1 default |
| Jail roof | #617B79 | Lambert / 1 default |
| Water-tower legs | #789796 | Lambert / 1 default |
| Water-tower tank | #78BEC7 | Lambert / 1 default, opaque |
| Water-tower roof | #F3D19A | Lambert / 1 default |
| Power wall | #F0C879 | Lambert / 1 default |
| Power roof | #5A8499 | Lambert / 1 default |
| Power chimney | #687F8A | Lambert / 1 default |
| Power door | #426575 | Lambert / 1 default |

Các part được tạo bằng box/cylinder/roof; landmark shadow width .95 local. Không có model riêng cho Mũi Cà Mau, Bến Ninh Kiều, Cầu Rồng, Chùa Cầu, Đại Nội, Hồ Gươm... Tên địa danh là metadata trong properties.ts, hiển thị qua displayLandmark/context/detail, **không phải bằng chứng có model 3D**. Landmark 81 bị UI display helper lọc, không có model tương ứng.

Placement: tile center y=.17, x offset +.48 ở left / -.48 ở right; z offset +.50 ở top / -.50 ở bottom. Không rotate toàn landmark theo side.

**Observation:** silhouettes giúp nhận ga/jail/điện/nước, palette teal/cream dịu hơn band màu. Ở follow, ga và water tower che phần tên/glyph in trên chính tile; không phải mọi landmark đều là decoration không ảnh hưởng readability. [Ảnh water](docs/task3-landmark-mobile.png). Các models này không có selected/active material override.

## 12. Upgrade Visualization

Game hiện tại là **Lv.0–Lv.5**, không phải 0–3. Renderer không sửa rules để phù hợp ví dụ task.

| Level | Model / scale / color | Placement |
| --- | --- | --- |
| Lv.0 | Không house model; owner strip nếu owned | Strip như section 9 |
| Lv.1 | Một house, wall height .32; owner roof; outer node scale .80 | Tile inner lip offset |
| Lv.2 | Hai house(1,color), mỗi child scale .43; owner roofs; outer .80 | Child x=(i-(level-1)/2)×.21 |
| Lv.3 | Ba house(1,color), same .43 child / .80 outer | Same spacing formula |
| Lv.4 | Bốn house(1,color), same .43 child / .80 outer | Same spacing formula |
| Lv.5 | Hotel wall height .85, roof #CC5B4C, flag; outer .80 | Same inner-lip position |

Parent position y=.18; x +.4 ở left / -.4 ở right, z +.4 ở top / -.4 ở bottom. Child rows luôn theo local X; không rotate rows theo cạnh bàn. Một house wall footprint .46×.43 trước scale; hotel footprint như house, tăng height. Hotel windows tạo 5 ô theo loop; Lv.1 tạo 1 ô. Lv.2–Lv.4 là multiple Lv.1 models, không phải một building tăng chiều cao.

**Observation:** Lv.1 → Lv.2 mỗi nhà nhỏ đi (effective child .43×.80=.344 so với .80 của single house); số lượng, không kích thước/height, diễn tả 2–4. Ở far khó đếm chắc 2/3/4. Ở follow, house row có thể che group strip/text và chạm pawn/ring. Lv.5 silhouette rõ nhưng hotel che một phần active pawn và property label trong [ảnh Lv.5](docs/task3-upgrade-5-mobile.png). Không có level badge 3D; context/detail cho biết level.

Ảnh: [Lv.1](docs/task3-upgrade-1-mobile.png), [Lv.2](docs/task3-upgrade-2-mobile.png), [Lv.3](docs/task3-upgrade-3-mobile.png), [Lv.4](docs/task3-upgrade-4-mobile.png), [Lv.5](docs/task3-upgrade-5-mobile.png), [overview upgrades](docs/task3-upgrades-overview-mobile.png).

Fixture audit sở hữu nguyên nhóm, level đồng đều trong từng nhóm; group levels 1/2/3/4/5/0/0/0, bank **3 houses / 9 hotels** còn lại. Đây là state fixture cho rendering, không phải diễn biến match được chơi từ đầu hoặc performance scenario đại diện mọi ván.

## 13. Active / Selected / Destination

| Visual | Color/material | Shape/opacity | Animation / duration / conditions |
| --- | --- | --- | --- |
| Current pawn focus | #285D59 Basic, DoubleSide | RingGeometry(.29,.37,24), horizontal; y=.17; opacity 1 default | Theo active pawn node mỗi draw; không pulse/glow/fade; không predicate chỉ WAITING; current player tồn tại thì position cập nhật |
| Current tile outline riêng | Not currently implemented | — | Không thay tile material của current tile |
| Selected property 3D | Not currently implemented | — | Pick trả tile index; Board mở context; không đổi atlas/ring/destination/camera target theo selection |
| Selected UI | Cream #FFF9E9, text #254B4C, secondary #48675E, owner indicator | PropertyContextCard / GameOverlay | Context manual giữ tới close/phase đổi; auto context optional có timer 5s |
| Destination / resolved tile | #D49422 LineBasicMaterial | LineLoop rectangle; y=.168; scale(width-.02,1,depth-.02); opacity 1 default | Visible đúng RESOLVING_TILE / PROPERTY_DECISION / UTILITY_ROLL / RENT / EVENT; không OPTIONAL_ACTIONS |
| Future destination before move | Not currently implemented | — | Outline lấy **current player.position**; không pre-highlight final movement target |

Destination linewidth **1, Three default**; WebGL renders line primitive một physical pixel theo dependency, không có custom thick outline. Không emissive/glow/bloom hoặc transparency animation. Duration **phase-driven**, không có một lifetime chung: RESOLVING_TILE timer650 ms (20 ms reduced motion) từ App; decision/rent/event giữ tới action. Outline không theo từng STEP_MOVE nếu phase MOVING.

Ring radius là world size, không scale chung .75 của pawn. Không đổi màu current pawn/roof khi active. `WORLD.focus.gold #F9BD3F` có token definition nhưng **không consumer trong current Three scene**; màu destination đang dùng là #D49422. UI CTA vàng dùng #FFDB7D→#EDB435, không cùng destination HEX.

Gold destination vs player4 #FFD46A / group-yellow #FACC15 / orange group #F59E0B: hue family gần, HEX và visual channel khác. Ring teal giúp active player có cue khác gold, nhưng thin destination line không mạnh ở overview. [Ảnh destination](docs/task3-destination-mobile.png) chụp đúng RESOLVING_TILE trước timer engine; không pause hoặc chỉnh logic.

[Ảnh selected khác current](docs/task3-selected-other-mobile.png): context **Nghệ An, index 29**, current pawn vẫn ở **Hà Tĩnh, index 27**, ring ở 27; không có world cue mới cho selected 29.

## 14. Material Inventory

**D** = “Uses Three.js default value”, đã kiểm local dependency và runtime. Roughness/metalness không có trên Lambert/Basic/LineBasic nên **N/A**, không phải 0. Emissive trên Basic/LineBasic cũng N/A, không tự gán black.

| Element | Material | Roughness | Metalness | Emissive | Transparent / opacity | Other |
| --- | --- | --- | --- | --- | --- | --- |
| Environment, tile bodies, buildings, landmarks, pawn, ownership | MeshLambertMaterial pool | N/A | N/A | #000000 D; intensity1 D | false D / 1 D | flatShading:true app-set; FrontSide D |
| Board print/atlas | MeshBasicMaterial | N/A | N/A | N/A | false D / 1 D | color #FFFFFF D, sRGB map; FrontSide D |
| Contact shadow | MeshBasicMaterial | N/A | N/A | N/A | true app-set / 1 D | color #FFFFFF D; alpha texture; depthWrite:false app-set |
| Active pawn ring | MeshBasicMaterial | N/A | N/A | N/A | false D / 1 D | color #285D59; DoubleSide app-set |
| Destination rectangle | LineBasicMaterial | N/A | N/A | N/A | false D / 1 D | color #D49422; linewidth1 D |
| Dice faces | Six MeshLambertMaterial with maps | N/A | N/A | #000000 D; intensity1 D | false D / 1 D | color #FFFFFF D; flatShading:false D; 64px maps |

Đa số material depthTest/depthWrite true, toneMapped true, **defaults**; shadow exception depthWrite:false. Renderer NoToneMapping nên toneMapped:true không tạo custom tone mapping effect. Lambert cache key là color string; box/sphere/cylinder/roof cùng color share material. Dice materials được tạo riêng theo face map.

MeshStandardMaterial, MeshPhongMaterial, SpriteMaterial, project ShaderMaterial: **Not currently implemented** trong current rendering 3D. Không có metallic/roughness/PBR controls. Built-in shaders bên trong Three không tính là project tự viết ShaderMaterial.

Geometry inventory: shared unit BoxGeometry, IcosahedronGeometry(1,1), ConeGeometry(1,1,4), CylinderGeometry(1,1,1,12), shadow PlaneGeometry; riêng pawn1 nón ConeGeometry(.29,.20,12), tile instancing, board custom BufferGeometry, RingGeometry, LineLoop và dice BoxGeometry(.34,.34,.34).

Material/default sources: [MeshLambertMaterial.js](node_modules/three/src/materials/MeshLambertMaterial.js), [MeshBasicMaterial.js](node_modules/three/src/materials/MeshBasicMaterial.js), [LineBasicMaterial.js](node_modules/three/src/materials/LineBasicMaterial.js), [Material.js](node_modules/three/src/materials/Material.js).

## 15. Canvas Atlas

| Setting | Current value / behavior |
| --- | --- |
| Atlas size | 1344×1344 |
| Grid / filled cells | 7×7, 40 tile cells dùng; 9 unused cells |
| Physical tile texture cell | 192×192 |
| Logical cell | 128×128; ctx.scale(1.5,1.5), cố định |
| Backgrounds | Property #FFF6DF, START #D8EDCB, LIFE #FBE0EB, other special #E1EBEB |
| Border | #A9B69E, 3 logical px |
| Name color | #254B4C |
| Price color | #48675E |
| Group color | Manifest group HEX; fillRect(3,3,122,25) |
| Font family | Be Vietnam Pro, Arial fallback |
| Name font | 700, 18 logical px |
| Price font | 500, 14 logical px |
| Rail/utility glyph | 700, 30 logical px |
| Other special glyph | 700, 38 logical px |
| Alignment | textAlign center; textBaseline không set, Canvas default alphabetic |
| Wrapping | Split words, measureText threshold113 logical px; line step23; không truncate full name |
| UV / geometry | One mesh, 40 quads, 160 vertices / 240 indices, 4 vertices mỗi tile; rotation by side |
| Texture color space | Explicit SRGBColorSpace |
| Mag filter | LinearFilter / 1006, **Uses Three.js default value** |
| Min filter | LinearMipmapLinearFilter / 1008, **Uses Three.js default value** |
| generateMipmaps | true, **Uses Three.js default value** |
| anisotropy | 1, **Uses Three.js default value** |
| wrapS / wrapT | ClampToEdgeWrapping, **Uses Three.js default value** |
| flipY / premultiplyAlpha | true / false, **Uses Three.js default value** |
| Texture format / type | RGBAFormat / UnsignedByteType, **Uses Three.js default value** |
| Rendering material | Basic map, default white multiply, unlit |
| DPR handling | Atlas cố định192, không dùng devicePixelRatio; renderer cap1.5 độc lập |

Name text được raster lên plane ở y=.155; không phải DOM text luôn hướng camera. Texture band orientation rotate theo side; corner không rotate. Labels do p.name / tile.name / fallback TILE_LABELS; không dùng shortName cho atlas.

Font lifecycle: renderer dựng fallback atlas ngay, `ensureBoardFonts()` explicit load weights500/700 với mẫu Vietnamese; khi ready rebuild atlas **một lần**, dispose geometry/map/material cũ. Timer2500 ms chỉ dataset diagnostic; late font vẫn refresh. Failed fonts giữ fallback; disposed guard tránh refresh scene đã destroy. Ảnh audit đều font-ready **Be Vietnam Pro**, refreshes1.

Shadow texture và dice face textures **64×64**, cùng helper sRGB/default filters. Dice Canvas body #FFF8E0, dots #335164; Lambert làm chúng chịu light, khác CSS dice unlit.

**Observation:** far view minification + oblique projection khiến detail chữ không đọc chắc. Follow tăng độ đọc nhưng không xoay tên upright với màn hình. Model/pawn occlusion không phải atlas thiếu text. Atlas unlit và models lit có color appearance khác dù dùng cùng semantic input. Atlas RGBA base ≈6.89MiB, chưa tính mipmaps/driver; không đo memory GPU thật trong audit.

Nguồn: tabletopArt.boardPrinting/canvasTexture/diceMaterials; fonts.ts.ensureBoardFonts; tabletopScene constructor font callback; dependency Texture/CanvasTexture.

## 16. Camera Readability

### Camera facts

Orthographic; near .1, far100, fixed direction offset **(12,14,12)**. Gameplay immersive halfHeight=max(5.9,8/aspect), overview fitOverview có xét .game-occluder. Follow target là active pawn với y=.38, **zoom3.2**; selected property không thành camera target. Ease time constant .17s, pawn tween420 ms, engine step480 ms thường. Không orbit controls/manual zoom/property-close mode.

### FAR / OVERVIEW

**Acceptable.** Layout/40 tile ring/group bands dễ nhận hơn detail. Active position có ring nhỏ, nhưng bốn pawns cùng Start che nhau trong ảnh A. Khi tách vị trí ở D, các pawn thấy được nhưng identity/owner colors khó hơn follow. Groups mạnh hơn environment; owner strip mảnh, top edge cùng mép band. Full detail/đếm nhà 2–4 không phải mục tiêu far, và không đạt reliably.

### MEDIUM / FOLLOW

**Needs Review.** Token/ring, band và ownership rõ hơn; level/special models nhìn được. Tuy nhiên pawn và model che name, hotel che một phần active pawn, top/left text orientation khó đọc; nhiều surrounding tiles bị UI/canvas cắt. Actor focus được frame để tránh UI nhiều hơn mọi label/landmark lân cận.

### CLOSE / PROPERTY

**Needs Review — dedicated close camera Not currently implemented.** Hiện có Follow + context/detail. Full name/owner/level/metadata đọc qua UI; không có selected 3D outline hoặc camera chuyển tới property khác active pawn. Landmark địa danh riêng chưa có model. Không gọi detail dialog là camera close đạt toàn bộ mục tiêu.

### Screenshots và metadata

Ảnh nguyên viewport, không crop/recolor; browser CSS DPR 2 nên file 852×393 xuất **1704×786**. Tất cả route gameplay `/`, font-ready, phase WAITING_FOR_ROLL ngoại trừ E. Zoom overview ghi1.000; follow≈3.200 (P2 frame cuối3.199, không thay camera để ép con số).

| ID / screenshot | Camera / phase | State & method |
| --- | --- | --- |
| A — [Overview](docs/task3-overview-mobile.png) | overview / WAITING_FOR_ROLL | UI real new 4-player game, tất cả Start0; không inject |
| D — [Owned properties](docs/task3-owned-property-mobile.png) | overview / WAITING_FOR_ROLL | Fixture: all28 assets owned, levels 0; players at1/13/24/37 |
| B — [Follow](docs/task3-follow-mobile.png) | follow / WAITING_FOR_ROLL | Same fixture, current P1 at 1 Cà Mau |
| C — [Property inspection](docs/task3-property-inspection-mobile.png) | follow / WAITING_FOR_ROLL | Existing select index 1/context; không camera close riêng |
| C detail — [Property sheet](docs/task3-property-detail-mobile.png) | follow / WAITING_FOR_ROLL | Existing detail dialog, full name/owner/level |
| E — [Destination](docs/task3-destination-mobile.png) | follow / RESOLVING_TILE | Fixture unowned Cà Mau 1; capture trước normal650 ms resolve; other players ởStart0 |
| F — [Water landmark](docs/task3-landmark-mobile.png) | follow / WAITING_FOR_ROLL | Fixture P1 at 28 Cấp nước, unowned |
| F wider — [932×430](docs/task3-landmark-wide-mobile.png) | follow / WAITING_FOR_ROLL | Same water fixture; only wider viewport |
| [Upgrade overview](docs/task3-upgrades-overview-mobile.png) | overview / WAITING_FOR_ROLL | Owned fixture group levels1/2/3/4/5/0/0/0 |
| [Lv.1](docs/task3-upgrade-1-mobile.png) | follow / WAITING_FOR_ROLL | P1 at 1, group Miền Tây level 1 |
| [Lv.2](docs/task3-upgrade-2-mobile.png) | follow / WAITING_FOR_ROLL | P1 at 6, group Phương Nam level 2 |
| [Lv.3](docs/task3-upgrade-3-mobile.png) | follow / WAITING_FOR_ROLL | P1 at 11, group Cao Nguyên level 3 |
| [Lv.4](docs/task3-upgrade-4-mobile.png) | follow / WAITING_FOR_ROLL | P1 at 16, group Duyên Hải level 4 |
| [Lv.5](docs/task3-upgrade-5-mobile.png) | follow / WAITING_FOR_ROLL | P1 at 21, group Di Sản level 5 |
| [Player2](docs/task3-player-2-mobile.png) | follow / WAITING_FOR_ROLL | Owned level0 fixture; current P2 at 6, light-blue group |
| [Player3](docs/task3-player-3-mobile.png) | follow / WAITING_FOR_ROLL | Owned level0 fixture; current P3 at31, green group |
| [Player4](docs/task3-player-4-mobile.png) | follow / WAITING_FOR_ROLL | Owned level0 fixture; current P4 at 27, yellow group |
| [Owned top](docs/task3-owned-top-mobile.png) | follow / WAITING_FOR_ROLL | Yellow group owner P2, current P1 at 27 |
| [Selected other](docs/task3-selected-other-mobile.png) | follow / WAITING_FOR_ROLL | Real raycast index 29 while current pawn remains 27 |

Except wider F, all **852×393**. Fixtures use existing createInitialGame/GameState/store API through temporary tooling; visual, economy data, engine reducers and camera settings untouched. Owners theo nhóm: Miền Tây/Di Sản P1; Phương Nam/Miền Trung Bắc P2; Cao Nguyên/Miền Bắc P3; Duyên Hải/Đô Thị P4. Ga/utilities assigned round-robin, levels 0. Upgrade fixture owns full sets/even levels and consistent bank. Các fixture không được mô tả là gameplay end-to-end tự nhiên.

Runtime diagnostics: A109 draw calls / 6,926 triangles; owned 114 / 7,598; upgrade overview 156 / 9,286. Đây là một frame ở fixture/viewport cụ thể, không FPS, battery hoặc thermal benchmark. Không dùng chúng làm số cố định mọi scene.

## 17. Color Collision Analysis

| Collision | Evidence / observation | Assessment |
| --- | --- | --- |
| Player3 mint #73D7A0 vs grass #8BC678 / rim #8AB978 / foliage #7AC783 | Cùng họ green, cùng Lambert lighting; ảnh P3 trên paper vẫn thấy nhờ hair/shoes/standing silhouette/ring | **Medium potential**, far identity yếu hơn; medium chấp nhận được trên paper |
| Player3/ownership vs green group #16A34A | Group dark/saturated Basic, owner mint Lambert. Ảnh P3 còn phân biệt fill nhưng hai cues cùng family | **Medium potential**, shape/position có ích; cần nhìn cả outline |
| Player4 #FFD46A vs yellow group #FACC15 / destination #D49422 | Ảnh P4 ởyellow group; clothing/hat và band cùng họ yellow. Destination ảnh E mảnh; ring vẫn teal | **Medium potential**, không phải duplicate HEX |
| Destination #D49422 vs orange group #F59E0B / paths #E6CF99 | Hue family gần; một-pixel line trên pale paper/cream borders | **Medium**, trọng lượng cue nhỏ; chưa chụp mọi gold-on-orange combination |
| Player2 #59BAFA vs Phương Nam #87CEEB / Đô Thị #1D4ED8 | Light-blue group gần hơn blue đô thị; ảnh P2 có owner strip xanh và band xanh cùng tile | **Medium**, standing shape/ring tốt hơn color-only |
| Player2 vs roofs #397D86 / #3F9293 / #5A8499 | Roof teal/slate khác HEX, geometry lớn, Lambert như pawn; visible adjacent train ảnh P2 | **Low potential** ở medium, không kết luận mất pawn |
| Player1 #EE6B73 vs Di Sản #DC2626 / hotel #CC5B4C | Coral player, red band, red hotel nhiều shades gần nhau. Ảnh Lv.5 vừa hue overlap vừa actual occlusion | **Medium color collision**, **High occlusion** ghi riêng ởissues |
| Player1 vs danger UI #973F31 / #FFE5D0 | Danger là dark rust text/pale surface, khác coral identity; nằm ở blocking UI | **Low potential**, không cùng owner/token mapping; không tạo error để cải thiện ảnh |
| Owner strip vs group band tại top side | Physical overlap + hue gần có thể đọc như một band nhiều màu; ảnhownedtop | **Medium confirmed layout collision** |
| Active ring #285D59 vs owner outline #285D59 / teal roofs | Same exact color cho ring/outline; shape khác, ring dưới pawn | **Low–Medium potential**, khi zoomxa/occluded phải dùng HUD/position cùng cue |

Mức collision là sơ bộ trên ảnh và source; không có color-blindness user study hoặc physical screen measurements. Không suy ra readability bằng so khoảng cách RGB đơn thuần. Không đề xuất HEX mới hoặc light/material values thay thế.

## 18. Gameplay Visual Hierarchy

| Layer | Rating | Observation |
| --- | --- | --- |
| 1 — Environment | **Acceptable** | Calm green/cream/teal, limited bright objects. Detached joints là artifact thấy rõ; pavilions/trees lớn hơn pawns ởfar |
| 2 — Board | **Good** | Raised footprint, pale tile surfaces và continuous40 tile loop tách khỏi grass; corners/group layout nhận ra |
| 3 — Property groups | **Acceptable** | 8 color bands mạnh và ổn định unlit; owner strips/upgrade models che một phần band ở một số side |
| 4 — Player / ownership | **Needs Review** | Four controlled colors, headgear/shoes giúp nhận; far tiny/stacked, hue cạnh tranh groups; owner strip orientation không đồng nhất |
| 5 — Gameplay focus | **Needs Review** | HUD + camera Follow + dark ring rõ ởmedium; hotel occludes active pawn, selected không world cue, destination thin và phase-limited |

Không đánh giá “group phải là mạnh nhất mọi lúc”: requirement là focus nổi bật khi cần; hiện HUD/gold CTA có visual weight lớn hơn outline ở world. Đây là observation hierarchy, không đề xuất đổi UI trong audit.

CSS overlay liên quan: activeHUD/camera selected #285D59; context primary #FFF9E9 + text #254B4C/#48675E; owner indicator đúngPLAYER_COLORS; group badge border từGROUPS; danger #973F31 trên#FFE5D0; CTA #FFDB7D→#EDB435. Keyboard tile-accessibility panel khi focus dùng selected/cream và48px targets. Các overlay là DOM/UI, không shader texture hoặc world lights. Backdrop46%teal ởdecision làm world tối đi khi dialog mở, nên detailshot không dùng làm bằng chứng màu mesh thuần.

## 19. Current Issues

| Issue | Severity | Evidence | Needs Review |
| --- | --- | --- | --- |
| Hotel che một phần current pawn/ring và property name | High | Lv.5 shot tại index 21 + house/pawn placement source; focus suy yếu dù Follow | Yes |
| Nhà/ga/utility models và pawn che printed names | Medium | Lv.1–4, Follow, water/rail images; full name vẫn tồn tại trong atlas/UI | Yes |
| Owner strip cố định +Z đè vào group band ở top, vị trí không tương đương trên 4 sides | Medium | setGame + UV rotation; ảnh owned top | Yes |
| Selected property chỉ có context, chưa có 3D selected cue/camera target | Medium | Ảnh selected 29/current 27; Board.select và TabletopScene.draw | Yes |
| Destination outline một physical pixel và phase-driven | Medium | LineBasic defaults + ảnh E; far cue có trọng lượng nhỏ | Yes |
| Player green/blue/yellow gần environment/group colors | Medium | Ảnh Player 2/3/4 + bảng collision; không phải duplicate HEX | Yes |
| Far không đếm chắc houses 2–4; Lv.1→2 mỗi model thu nhỏ | Medium | Upgrade overview, child scale .43; level text qua UI | Yes |
| Nhiều pawn cùng tile che nhau | Medium | Overview A tại Start + offsets nhỏ; P4 phía trước che các pawn khác | Yes |
| Property-close camera riêng và model 3D địa danh từng LAND chưa có | Medium | Chỉ overview/follow; landmark factory chỉ RAILROAD/UTILITY/JAIL | Yes |
| Joints đứng rời ở ngoài island | Low | Ảnh A/F/Lv.5; z±7.66 so với stone half-depth 6.65 | Yes |
| Lambert lit vs Basic printed colors khác nhau | Low | Material/color pipeline inventory; chưa chứng minh bug gamma/clipping | Yes — visual direction review |
| Chưa kiểm Android/iPhone/Safari thật hoặc accessibility color perception | Medium | Chỉ desktop Chrome mobile emulation | Yes — evidence gap |

Issue list ghi hiện trạng, không đồng nghĩa tất cả phải fix trong task kế tiếp. Không có solution/palette V2/material/lighting/camera patch trong audit này.

### Source preservation và audit validation

- **61 production files** được SHA256 trước/sau: toàn bộ src, design manifest, index/package/lock/Vite/tsconfig. Không file nào thay đổi, không thêm production source.
- Aggregate digest baseline: `6eeb3dc5f2fbdfe4acbcaa1ed720cdda0569b3a4f53f0804ab1a1ed14b14b03e` (SHA256 của ordered path→hash mapping); hashes so trực tiếp trước/sau, không chỉ dựa workingtree clean.
- 19 ảnh đã capture và xem; font-ready/refresh 1, không page scroll ở phiên capture, **0 console/page errors**.
- Temporary scene runtime xác nhận material/renderer/light/defaults, sau đó destroy. Tooling/baseline/evidence JSON tạm được dọn; metadata quan trọng lưu trong tài liệu này.
- Không chạy lại full regression/build vì production không thay đổi và không thấy lỗi runtime. Typecheck / 86 tests / build đã pass trước commit 2019a79; không claim đó là test mới của Task #3.
- Không commit/push trong audit; kết quả là reference và screenshots. Kế hoạch review có sẵn tại [task3-audit-review-plan.md](docs/task3-audit-review-plan.md).

## 20. Source Map

| Feature | File | Relevant function/component |
| --- | --- | --- |
| Gameplay/prototype route | src/App.tsx | App |
| Overview/follow policy, selected context | src/components/Board.tsx | Board, phase effects, select |
| Scene lifecycle, resize, raycast event, DOM accessible tiles | src/components/ThreeBoard.tsx | ThreeBoard effects/frame/select |
| Renderer + lights | src/rendering/tabletopScene.ts | TabletopScene.constructor |
| World ground/island/grass/path/fountain/props | src/rendering/tabletopScene.ts | environment |
| Static instancing | src/rendering/tabletopScene.ts | batchScenery |
| Tile bodies / print mesh / special models | src/rendering/tabletopScene.ts | constructor |
| Ownership/houses/pawns | src/rendering/tabletopScene.ts | setGame |
| Ring/destination/dice motion/render diagnostics | src/rendering/tabletopScene.ts | draw |
| Raycast | src/rendering/tabletopScene.ts | pick |
| Camera projection/framing | src/rendering/tabletopScene.ts | resize/reframe/draw |
| Resource cleanup | src/rendering/tabletopScene.ts | destroy |
| Lambert pool/primitive geometry | src/rendering/tabletopArt.ts | TabletopArt.material/box/sphere/cylinder/roof |
| Blob shadow | src/rendering/tabletopArt.ts | constructor/shadow |
| Printed atlas | src/rendering/tabletopArt.ts | boardPrinting/canvasTexture |
| Upgrade models | src/rendering/tabletopArt.ts | house |
| Special landmarks | src/rendering/tabletopArt.ts | landmark |
| Environment foliage/pavilion | src/rendering/tabletopArt.ts | tree/pavilion |
| Player token/appearance | src/rendering/tabletopArt.ts | pawn |
| Dice maps/materials | src/rendering/tabletopArt.ts | diceMaterials |
| World/player/UI constants | src/visual/tokens.ts | WORLD/PLAYER_COLORS/UI_COLORS/TYPE/installVisualTokens |
| Font files and explicit glyph load | src/visual/fonts.css, fonts.ts | @font-face / ensureBoardFonts |
| UI alpha/backdrop roles | src/visual/tokens.css | :root surface/backdrop variables |
| Board 40 tile footprint | src/rendering/squareBoard.ts | squareTile/SQUARE_TILES |
| Screen space occlusion | src/rendering/cameraFraming.ts | fitOverview/followAnchor |
| Groups/assets/geometry baseline | docs/classic-vietnam-v2.json | groups/assets/geometry |
| Group definitions | src/game/data/groups.ts | GROUPS |
| Property name metadata | src/game/data/properties.ts | PROPERTIES/landmarks |
| Renderer tile labels | src/game/data/tileLabels.ts | TILE_LABELS |
| Owner identity DOM | src/components/PlayerIndicator.tsx, format.ts | PlayerIndicator / PLAYER_COLORS re-export |
| HUD | src/App.tsx | App players/header |
| Property context | src/components/PropertyContextCard.tsx | PropertyContextCard |
| Detail / group badge/owner/backdrop | src/components/GameOverlay.tsx | GameOverlay/Sheet |
| Display metadata/level | src/components/gameplayUI.ts; src/game/engine/selectors.ts | displayLandmark / buildingLabel (read-only) |
| UI overlay styling | src/styles.css | .property-context/.player-indicator/.asset-badge/.play-camera/.three-accessibility |
| Group CSS variables | src/main.tsx | Entry GROUPS variable install |
| Three prototype framing | src/components/GraphicsPreview.tsx | GraphicsPreview, ThreeBoard immersive=false |
| Pixi study — ngoài current 3D audit | src/rendering/boardScene.ts, sceneArt.ts; src/components/PixiBoard.tsx, PixiPreview.tsx | BoardScene / art factories / previews |
| DOM fallback — ngoài material inventory | src/components/ClassicBoard.tsx | ClassicBoard |
| Three defaults | node_modules/three/src/renderers/WebGLRenderer.js; math/ColorManagement.js; math/Color.js | Constructor / createColorManagement / setHex/setStyle |
| Texture defaults | node_modules/three/src/textures/Texture.js, CanvasTexture.js | Constructors |
| Material defaults | node_modules/three/src/materials/Material.js, MeshLambertMaterial.js, MeshBasicMaterial.js, LineBasicMaterial.js | Constructors |
| Shadow defaults | node_modules/three/src/renderers/webgl/WebGLShadowMap.js; lights/LightShadow.js, DirectionalLightShadow.js; core/Object3D.js | Constructors |
