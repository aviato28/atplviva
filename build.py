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
for f in sorted(glob.glob('src/*.txt')):
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
json.dump({'title':'ATPL Viva','topics':topics},open('content.json','w'),ensure_ascii=False,indent=0)
print(len(topics),'topics',sum(len(t['cards']) for t in topics),'cards')
