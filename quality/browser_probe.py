"""検査ページだけの観測。ゲームの時計・操作・保存を書き換えない。"""

import json
from datetime import UTC, datetime

DIAGNOSTICS = []
PAGES = {}

PROBE = """(() => {
    const snapshot = () => {
        const s = window.wordGuildState;
        if (!s) return null;
        return {...s, at:performance.now(),
            cells:document.querySelectorAll('[data-cell]').length,
            disabled:document.querySelectorAll('[data-cell]:disabled').length,
            boardDisabled:document.querySelector('#board')?.getAttribute('aria-disabled'),
            cuts:document.querySelectorAll('#claws .claw-cut').length,
            cutDetails:Array.from(document.querySelectorAll('#claws .claw-cut'),e=>({
                cut:e.dataset.cut, started:Number(e.dataset.started),
                material:e.dataset.material,
                texture:!!e.querySelector('image')?.getAttribute('href')
            })),
            viewClass:document.querySelector('#view')?.className,
            road:!!document.querySelector('.road-scene')};
    };
    const probe = window.qualityProbe = {events:[], transitions:[], cutRenders:[], snapshot};
    for (const type of ['click','pointerup','pointercancel']) {
        let before;
        document.addEventListener(type, e => {
            before = {type, target:e.target.closest?.('button')?.id,
                      before:snapshot()};
        }, true);
        document.addEventListener(type, () => {
            probe.events.push({...before, after:snapshot()});
        });
    }
    let previous;
    const record = () => {
        const s = snapshot();
        if (!s) return;
        const key = JSON.stringify([s.screen,s.state,s.stage,s.cells,s.disabled,s.cuts]);
        if (key !== previous) {
            probe.transitions.push(s); previous = key;
            if (s.cuts) probe.cutRenders.push(s);
        }
    };
    new MutationObserver(record).observe(document, {
        subtree:true,childList:true,attributes:true
    });
})();"""


def prepare(page):
    diagnostic = {"url": "", "pageerrors": [], "requestfailed": [], "http_errors": []}
    DIAGNOSTICS.append(diagnostic)
    PAGES[id(page)] = diagnostic
    page.on("pageerror", lambda error: diagnostic["pageerrors"].append(str(error)))
    page.on(
        "requestfailed",
        lambda request: diagnostic["requestfailed"].append(
            {"url": request.url, "failure": request.failure} | {"at": datetime.now(UTC).isoformat()}
        ),
    )
    page.on(
        "response",
        lambda response: (
            diagnostic["http_errors"].append({"url": response.url, "status": response.status})
            if response.status >= 400
            else None
        ),
    )
    page.add_init_script(PROBE)
    return diagnostic


def navigate(page, url, timeout=30000):
    """状態公開だけでなく、指定した開発シーンの表示まで待つ。"""
    diagnostic = PAGES.get(id(page))
    if diagnostic is not None:
        diagnostic["url"] = url
    try:
        capture(page)
        page.goto(url, wait_until="load")
        page.wait_for_function(
            """() => {
            const s=window.wordGuildState, p=new URLSearchParams(location.search);
            if (!s || !document.querySelector('#view')?.children.length) return false;
            if (p.get('dev') !== '1') return s.screen === 'home';
            const name=p.get('scene') || 'home';
            if (!window.wordGuildDev || !document.querySelector('#dev-state')) return false;
            if (['home','return'].includes(name)) return s.screen === 'home';
            if (name === 'select') return s.screen === 'select';
            const stages=['cat','dog','sun','ant','animal','final'];
            return stages.includes(name) ? s.stage === stages.indexOf(name) && s.state === 'battle'
                : s.state === name;
        }""",
            timeout=timeout,
        )
        page.wait_for_function(
            "Array.from(document.images).every(i=>i.complete && i.naturalWidth>0)"
        )
        if diagnostic is not None:
            diagnostic.setdefault("ready", []).append(
                {"url": url, "state": page.evaluate("wordGuildState")}
            )
    except Exception as error:
        raise AssertionError(
            f"初期化失敗: {url}; {error}; diagnostics={json.dumps(DIAGNOSTICS, ensure_ascii=False)}"
        ) from error


def capture(page):
    diagnostic = PAGES.get(id(page))
    if diagnostic is not None and page.evaluate("!!window.qualityProbe"):
        diagnostic.setdefault("observations", []).append(
            page.evaluate(
                "({events:qualityProbe.events, transitions:qualityProbe.transitions, "
                "cutRenders:qualityProbe.cutRenders})"
            )
        )


def event(page, kind="pointerup", target=None):
    return page.evaluate(
        "([kind,target])=>qualityProbe.events.findLast(e=>e.type===kind && "
        "(target===null || e.target===target))",
        [kind, target],
    )


def phase(page, stage, name):
    """実時間の自然な遷移を履歴で待ち、一瞬の状態の読み逃しを防ぐ。"""
    page.wait_for_function(
        "([stage,name])=>qualityProbe.transitions.some(s=>s.stage===stage && s.state===name)",
        arg=[stage, name],
    )
    return page.evaluate(
        "([stage,name])=>qualityProbe.transitions.findLast(s=>s.stage===stage && s.state===name)",
        [stage, name],
    )


def cut_render(page, stage, since=0, timeout=30000):
    """DOMへ描画された時の本数・状態を一つの履歴から返す。時計は止めない。"""
    try:
        handle = page.wait_for_function(
            "([stage,since])=>qualityProbe.cutRenders.find(s=>s.stage===stage && s.at>=since)",
            arg=[stage, since],
            timeout=timeout,
        )
        observed = handle.json_value()
        handle.dispose()
        return observed
    finally:
        capture(page)
