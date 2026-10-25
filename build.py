#!/usr/bin/env python3
"""Builds content.json from src/*.txt. Format:
# Topic title
== Note title   (body lines follow)
Q: question   (QN: = number card for the Numbers drill)
A: answer lines
T: memory tip
"""
import glob,json,re
topics=[]
for f in sorted(glob.glob('src/[0-9]*.txt')):
    t=None;cur=None;fld=None
    for ln in open(f,encoding='utf8').read().split('\n'):
        if ln.startswith('# '):
            t={'id':re.sub(r'\W+','-',ln[2:].lower()).strip('-'),'title':ln[2:].strip(),'notes':[],'cards':[]};topics.append(t);cur=None;fld=None
        elif ln.startswith('== '):
            cur={'t':ln[3:].strip(),'b':''};t['notes'].append(cur);fld='nb'
        elif re.match(r'QN?: ',ln):
            cur={'q':ln.split(': ',1)[1]};
            if ln.startswith('QN'):cur['n']=1
            t['cards'].append(cur);fld='q'
        elif ln.startswith('A: ') and fld in('q','a','t'):cur['a']=ln[3:];fld='a'
        elif ln.startswith('T: ') and fld in('q','a','t'):cur['tip']=ln[3:];fld='t'
        elif fld=='nb':cur['b']+=('\n' if cur['b'] else '')+ln
        elif fld=='q':cur['q']+='\n'+ln
        elif fld=='a':cur['a']+='\n'+ln
        elif fld=='t':cur['tip']+='\n'+ln
    for x in t['notes'] if t else []:x['b']=x['b'].strip()
    for x in t['cards'] if t else []:
        x['a']=x.get('a','').strip();x['q']=x['q'].strip()
for t in topics:
    t['notes']=[ (n['t'],n['b']) for n in t['notes']]
    t['notes']=[{'t':a,'b':b} for a,b in t['notes']]
# chains: src/chains.txt  ->  '@ N' topic number, 'CH: title', then S:/A: pairs
chains=[];ch=None;fld=None;tnum=None
import os
if os.path.exists('src/chains.txt'):
    for ln in open('src/chains.txt',encoding='utf8').read().split('\n'):
        if ln.startswith('@ '):tnum=ln[2:].strip()
        elif ln.startswith('CH: '):
            ch={'title':ln[4:].strip(),'topic':next(t['title'] for t in topics if t['title'].startswith(tnum+'. ')),'steps':[]};chains.append(ch);fld=None
        elif ln.startswith('S: '):ch['steps'].append({'q':ln[3:]});fld='q'
        elif ln.startswith('A: '):ch['steps'][-1]['a']=ln[3:];fld='a'
        elif ln.strip() and fld:ch['steps'][-1][fld]+='\n'+ln
# must-know tags: src/top.txt = question prefixes
top=[l.strip() for l in open('src/top.txt',encoding='utf8') if l.strip()] if os.path.exists('src/top.txt') else []
hit=set()
for t in topics:
    for c in t['cards']:
        for p in top:
            if c['q'].startswith(p):c['m']=1;hit.add(p)
miss=[p for p in top if p not in hit]
if miss:print('UNMATCHED TOP:',miss)
json.dump({'title':'ATPL Viva','topics':topics,'chains':chains},open('content.json','w'),ensure_ascii=False,indent=0)
print(len(chains),'chains',sum(1 for t in topics for c in t['cards'] if c.get('m')),'must-know');print(len(topics),'topics',sum(len(t['cards']) for t in topics),'cards')
