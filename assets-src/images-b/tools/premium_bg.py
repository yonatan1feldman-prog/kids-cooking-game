# The premium round, PR 2 ("light and depth", research/premium-spec.md section 2.5): calmer, brighter backgrounds.
# The big backgrounds carried the same heavy paper grain as the play things and read flat and faded behind them. Every
# background generator passes its finished SVG through `calm()`:
#  * its paper filter ({p}gr, material "bg") is rebuilt with the grain (tooth, fibres, mottle) at `grain` (60%),
#    same seed, so the paper stays where it was, only quieter;
#  * the whole picture is lifted a few percent (`bright`, a component transfer: slope 1 + b, a small offset);
#  * `swap` replaces colours (the farm's and the market's greyish sky blue with a clearer one).
# The play things (900 files) are not touched: they stand out by themselves once the background settles.
# The kitchen keeps its wall exactly as it was (its tappable pieces, gen_kitchen_live.py, are cut from it and must
# match): there only the counter is calmed and lit, inside gen_kitchen.bg_kitchen itself (`paper_soft`).
import re
from pb import MATERIALS, f_paper

GRAIN = 0.6
BRIGHT = 0.05
# the old sky top (farm, market, garden: greyish) -> a clearer, warmer-lit blue
SKY_SWAP = {"#9FCBE0": "#8DCAEE"}


def paper_soft(fid, seed, grain=GRAIN):
    """The background paper filter with its grain at `grain` (the same seed: the same paper, quieter)."""
    m = MATERIALS["bg"]
    return f_paper(fid, "bg", seed, 1.0, tooth=m["tooth"] * grain, fibre=m["fibre"] * grain, mottle=m["mottle"] * grain)


def lift_filter(fid, bright=BRIGHT):
    s = 1 + bright
    o = bright * 0.4
    fn = f'type="linear" slope="{s:.3f}" intercept="{o:.3f}"'
    return (f'<filter id="{fid}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">'
            f'<feComponentTransfer><feFuncR {fn}/><feFuncG {fn}/><feFuncB {fn}/></feComponentTransfer></filter>')


def calm(svg_text, p, grain=GRAIN, bright=BRIGHT, swap=None):
    fid = p + "gr"
    m = re.search(rf'<filter id="{re.escape(fid)}".*?</filter>', svg_text)
    assert m, f"no paper filter {fid}"
    seed = int(re.search(r'seed="(\d+)"', m.group(0)).group(1))
    out = svg_text.replace(m.group(0), paper_soft(fid, seed, grain) + lift_filter(p + "lift", bright), 1)
    opener = f'<g filter="url(#{fid})">'
    assert out.count(opener) == 1, f"the picture's paper group {fid}"
    i = out.index(opener)
    j = out.rindex("</svg>")
    out = out[:i] + f'<g filter="url(#{p}lift)">' + out[i:j] + "</g>" + out[j:]
    for a, b in (swap or {}).items():
        out = out.replace(f'stop-color="{a}"', f'stop-color="{b}"')
    return out
