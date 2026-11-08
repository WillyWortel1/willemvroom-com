from PIL import Image,ImageDraw,ImageFont
import json,math,pathlib
P=pathlib.Path('/workspace/com-news-maps');F='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';red='#dc143c';ink='#232323'
def font(n):return ImageFont.truetype(F,n)
def base(title):
 im=Image.new('RGB',(1920,1080),'white');d=ImageDraw.Draw(im);d.rectangle((0,0,1920,20),fill=red);d.text((100,65),title,font=font(55),fill=ink);return im,d
def label(d,xy,text,size=30):d.text(xy,text,font=font(size),fill=ink,stroke_width=2,stroke_fill='white')
def marker(d,x,y,num,r=25):
 d.ellipse((x-r,y-r,x+r,y+r),fill=red,outline='white',width=4);d.text((x,y),str(num),font=font(30),fill='white',anchor='mm')
im,d=base('Kraków — two confirmed locations');M=Image.new('RGB',(560,660),'#f4f4f1');md=ImageDraw.Draw(M)
# Local equirectangular projection; uniform metre scale in both axes.
lon0,lat0=19.926,50.066;scale=660/.019
cos=math.cos(math.radians(50.0565))
def proj(lon,lat):return ((lon-lon0)*cos*scale,(lat0-lat)*scale)
a=json.loads((P/'streets.json').read_text())['elements']
for e in a:
 t=e.get('tags',{});g=e.get('geometry',[])
 if len(g)<2:continue
 pts=[proj(v['lon'],v['lat']) for v in g]
 if t.get('leisure')=='park' and len(pts)>2:md.polygon(pts,fill='#e2e9df')
for e in a:
 t=e.get('tags',{});h=t.get('highway');g=e.get('geometry',[])
 if not h or h in ['steps','service','path','cycleway','track','corridor','platform','footway']:continue
 pts=[proj(v['lon'],v['lat']) for v in g]
 if len(pts)<2:continue
 width=6 if h in ['primary','secondary','tertiary'] else 3
 md.line(pts,fill='#a4a4a4',width=width+2);md.line(pts,fill='white',width=width)
x,y=proj(19.937194,50.061694);md.ellipse((x-42,y-42,x+42,y+42),fill=None,outline=red,width=4);marker(md,x,y,1,23)
x,y=proj(19.9414882,50.051876);marker(md,x,y,2)
# No event route drawn; grey/white lines are OSM streets only.
im.paste(M,(100,170));d=ImageDraw.Draw(im);d.rectangle((100,170,660,830),outline='#777777',width=2)
label(d,(125,185),'N ↑',26)
# 250 metres, derived from projection scale.
l=250/111320*scale;d.line((125,795,125+l,795),fill=ink,width=4);label(d,(125,755),'250 m',23)
for y,num,title,desc in [(220,1,'Main Market Square / Rynek Główny','Area of the shooting'),(420,2,'Dietla / Stradomska','Vicinity of the arrest')]:
 marker(d,760,y+20,num);label(d,(810,y),title,38);label(d,(810,y+65),desc,32)

label(d,(100,1015),'© OpenStreetMap contributors • openstreetmap.org/copyright • ODbL',26)
im.save(P/'city-map.png')
im,d=base('Kraków and Ostrowiec Świętokrzyski');geo=json.loads((P/'countries.geojson').read_text());pol=next(f for f in geo['features'] if f['properties'].get('ADMIN')=='Poland');geom=pol['geometry'];polys=geom['coordinates'] if geom['type']=='MultiPolygon' else [geom['coordinates']]
scale=640/6.3;cos=math.cos(math.radians(52));
def pp(lon,lat):return (120+(lon-13.8)*cos*scale,170+(55.2-lat)*scale)
for poly in polys:
 pts=[pp(*v[:2]) for v in poly[0]];d.polygon(pts,fill='#f1f1ed',outline='#888888',width=3)
label(d,(160,205),'POLAND',30);label(d,(140,255),'N ↑',26)
x,y=pp(19.937194,50.061694);marker(d,x,y,1);label(d,(x-95,y+35),'Kraków',27)
x,y=pp(21.389888,50.943948);marker(d,x,y,3);label(d,(x+35,y-12),'Ostrowiec',27)
label(d,(910,245),'1 and 2  Kraków',41);label(d,(910,310),'Shooting and arrest',31)
label(d,(910,435),'3  Ostrowiec Świętokrzyski',41);label(d,(910,500),'Three bodies found in a home',31)
label(d,(100,1015),'Map: Natural Earth (public domain) • city positions: OSM / Polish PRNG register',25)
im.save(P/'poland-map.png')
(P/'cartography.md').write_text('OSM Overpass street geometry, bbox 50.047,19.926,50.066,19.951. Equirectangular local projection with cos(latitude) factor, north up. Rynek 50.061694,19.937194 representative square centre, broad area ring, not firing position. Dietla/Stradomska shared OSM street node 2418596893 = 50.051876,19.9414882; marker denotes vicinity, not exact arrest position. Ostrowiec city-centre point PRNG 50.943948,21.389888; no private address. Poland boundary Natural Earth 10m. No connecting route drawn.\n')
