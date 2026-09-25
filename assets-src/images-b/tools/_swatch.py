import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pb import *
p="sw-"
L=[G(P(wob(150,150,110,105,.03,1),RED_D),p+"cut"), G(P(wob(150,146,98,94,.03,2),RED),p+"sh"), G(P(wob(150,146,70,66,.03,3),RED_L),p+"sh")]
L.append(G(P(wrect(300,40,260,220,40,1.2,4),TEAL),p+"cut")+G(P(wrect(322,64,216,172,26,1.2,5),CREAM),p+"sh"))
L.append(G(P(wob(740,150,120,110,.02,6),DOUGH),p+"cut"))
s=svg(900,300,std_defs(p), G("".join(L),p+"gr"))
open(os.path.join(os.path.dirname(os.path.abspath(__file__)),"_swatch.svg"),"w").write(s)
