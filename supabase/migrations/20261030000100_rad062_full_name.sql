-- RAD-062 M01: deferred until the single reviewed DB day; no legacy backfill.
-- Readiness: validator true/false, name_entry_v1, trigger and unchanged v1 ACL/OIDs.
-- Rollback: restore replaced function bodies from B; drop new RPC/trigger/validator.
-- No data rewrite; forward-fix preferred. Keep the package guard false throughout.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
do $guard$ begin
 if to_regprocedure('assess.scope_enter_v1(boolean)') is null
 or to_regprocedure('assess.scope_page_v1(text,uuid,uuid,integer)') is null
 or not (select count(*)=1 and bool_and(not enabled) from assess.launch_gate) then
  raise exception 'current schema through B and closed launch gate required' using errcode='55000';
 end if;
end $guard$;

-- ECMAScript WhiteSpace + LineTerminator and Unicode 17.0 Letter ranges.
-- Generated from the current client's /\p{L}/u, not locale-dependent POSIX alpha.
-- Bounded input: trim first, at most 100 code points, then count letter-containing words.
create function public.rad062_valid_full_name(p_name text) returns boolean
language sql immutable parallel safe set search_path='' as $fn$
 select coalesce(char_length(n) between 1 and 100 and
  (select count(*)>=3 from regexp_split_to_table(n,U&'[\0009\000a\000b\000c\000d\0020\00a0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200a\2028\2029\202f\205f\3000\feff]+') w
   where w collate "C" ~ '[A-Za-zªµºÀ-ÖØ-öø-ˁˆ-ˑˠ-ˤˬˮͰ-ʹͶ-ͷͺ-ͽͿΆΈ-ΊΌΎ-ΡΣ-ϵϷ-ҁҊ-ԯԱ-Ֆՙՠ-ֈא-תׯ-ײؠ-يٮ-ٯٱ-ۓەۥ-ۦۮ-ۯۺ-ۼۿܐܒ-ܯݍ-ޥޱߊ-ߪߴ-ߵߺࠀ-ࠕࠚࠤࠨࡀ-ࡘࡠ-ࡪࡰ-ࢇࢉ-࢏ࢠ-ࣉऄ-हऽॐक़-ॡॱ-ঀঅ-ঌএ-ঐও-নপ-রলশ-হঽৎড়-ঢ়য়-ৡৰ-ৱৼਅ-ਊਏ-ਐਓ-ਨਪ-ਰਲ-ਲ਼ਵ-ਸ਼ਸ-ਹਖ਼-ੜਫ਼ੲ-ੴઅ-ઍએ-ઑઓ-નપ-રલ-ળવ-હઽૐૠ-ૡૹଅ-ଌଏ-ଐଓ-ନପ-ରଲ-ଳଵ-ହଽଡ଼-ଢ଼ୟ-ୡୱஃஅ-ஊஎ-ஐஒ-கங-சஜஞ-டண-தந-பம-ஹௐఅ-ఌఎ-ఐఒ-నప-హఽౘ-ౚ౜-ౝౠ-ౡಀಅ-ಌಎ-ಐಒ-ನಪ-ಳವ-ಹಽ೜-ೞೠ-ೡೱ-ೲഄ-ഌഎ-ഐഒ-ഺഽൎൔ-ൖൟ-ൡൺ-ൿඅ-ඖක-නඳ-රලව-ෆก-ะา-ำเ-ๆກ-ຂຄຆ-ຊຌ-ຣລວ-ະາ-ຳຽເ-ໄໆໜ-ໟༀཀ-ཇཉ-ཬྈ-ྌက-ဪဿၐ-ၕၚ-ၝၡၥ-ၦၮ-ၰၵ-ႁႎႠ-ჅჇჍა-ჺჼ-ቈቊ-ቍቐ-ቖቘቚ-ቝበ-ኈኊ-ኍነ-ኰኲ-ኵኸ-ኾዀዂ-ዅወ-ዖዘ-ጐጒ-ጕጘ-ፚᎀ-ᎏᎠ-Ᏽᏸ-ᏽᐁ-ᙬᙯ-ᙿᚁ-ᚚᚠ-ᛪᛱ-ᛸᜀ-ᜑᜟ-ᜱᝀ-ᝑᝠ-ᝬᝮ-ᝰក-ឳៗៜᠠ-ᡸᢀ-ᢄᢇ-ᢨᢪᢰ-ᣵᤀ-ᤞᥐ-ᥭᥰ-ᥴᦀ-ᦫᦰ-ᧉᨀ-ᨖᨠ-ᩔᪧᬅ-ᬳᭅ-ᭌᮃ-ᮠᮮ-ᮯᮺ-ᯥᰀ-ᰣᱍ-ᱏᱚ-ᱽᲀ-ᲊᲐ-ᲺᲽ-Ჿᳩ-ᳬᳮ-ᳳᳵ-ᳶᳺᴀ-ᶿḀ-ἕἘ-Ἕἠ-ὅὈ-Ὅὐ-ὗὙὛὝὟ-ώᾀ-ᾴᾶ-ᾼιῂ-ῄῆ-ῌῐ-ΐῖ-Ίῠ-Ῥῲ-ῴῶ-ῼⁱⁿₐ-ₜℂℇℊ-ℓℕℙ-ℝℤΩℨK-ℭℯ-ℹℼ-ℿⅅ-ⅉⅎↃ-ↄⰀ-ⳤⳫ-ⳮⳲ-ⳳⴀ-ⴥⴧⴭⴰ-ⵧⵯⶀ-ⶖⶠ-ⶦⶨ-ⶮⶰ-ⶶⶸ-ⶾⷀ-ⷆⷈ-ⷎⷐ-ⷖⷘ-ⷞⸯ々-〆〱-〵〻-〼ぁ-ゖゝ-ゟァ-ヺー-ヿㄅ-ㄯㄱ-ㆎㆠ-ㆿㇰ-ㇿ㐀-䶿一-ꒌꓐ-ꓽꔀ-ꘌꘐ-ꘟꘪ-ꘫꙀ-ꙮꙿ-ꚝꚠ-ꛥꜗ-ꜟꜢ-ꞈꞋ-Ƛ꟱-ꠁꠃ-ꠅꠇ-ꠊꠌ-ꠢꡀ-ꡳꢂ-ꢳꣲ-ꣷꣻꣽ-ꣾꤊ-ꤥꤰ-ꥆꥠ-ꥼꦄ-ꦲꧏꧠ-ꧤꧦ-ꧯꧺ-ꧾꨀ-ꨨꩀ-ꩂꩄ-ꩋꩠ-ꩶꩺꩾ-ꪯꪱꪵ-ꪶꪹ-ꪽꫀꫂꫛ-ꫝꫠ-ꫪꫲ-ꫴꬁ-ꬆꬉ-ꬎꬑ-ꬖꬠ-ꬦꬨ-ꬮꬰ-ꭚꭜ-ꭩꭰ-ꯢ가-힣ힰ-ퟆퟋ-ퟻ豈-舘並-龎ﬀ-ﬆﬓ-ﬗיִײַ-ﬨשׁ-זּטּ-לּמּנּ-סּףּ-פּצּ-ﮱﯓ-ﴽﵐ-ﶏﶒ-ﷇﷰ-ﷻﹰ-ﹴﹶ-ﻼＡ-Ｚａ-ｚｦ-ﾾￂ-ￇￊ-ￏￒ-ￗￚ-ￜ𐀀-𐀋𐀍-𐀦𐀨-𐀺𐀼-𐀽𐀿-𐁍𐁐-𐁝𐂀-𐃺𐊀-𐊜𐊠-𐋐𐌀-𐌟𐌭-𐍀𐍂-𐍉𐍐-𐍵𐎀-𐎝𐎠-𐏃𐏈-𐏏𐐀-𐒝𐒰-𐓓𐓘-𐓻𐔀-𐔧𐔰-𐕣𐕰-𐕺𐕼-𐖊𐖌-𐖒𐖔-𐖕𐖗-𐖡𐖣-𐖱𐖳-𐖹𐖻-𐖼𐗀-𐗳𐘀-𐜶𐝀-𐝕𐝠-𐝧𐞀-𐞅𐞇-𐞰𐞲-𐞺𐠀-𐠅𐠈𐠊-𐠵𐠷-𐠸𐠼𐠿-𐡕𐡠-𐡶𐢀-𐢞𐣠-𐣲𐣴-𐣵𐤀-𐤕𐤠-𐤹𐥀-𐥙𐦀-𐦷𐦾-𐦿𐨀𐨐-𐨓𐨕-𐨗𐨙-𐨵𐩠-𐩼𐪀-𐪜𐫀-𐫇𐫉-𐫤𐬀-𐬵𐭀-𐭕𐭠-𐭲𐮀-𐮑𐰀-𐱈𐲀-𐲲𐳀-𐳲𐴀-𐴣𐵊-𐵥𐵯-𐶅𐺀-𐺩𐺰-𐺱𐻂-𐻇𐼀-𐼜𐼧𐼰-𐽅𐽰-𐾁𐾰-𐿄𐿠-𐿶𑀃-𑀷𑁱-𑁲𑁵𑂃-𑂯𑃐-𑃨𑄃-𑄦𑅄𑅇𑅐-𑅲𑅶𑆃-𑆲𑇁-𑇄𑇚𑇜𑈀-𑈑𑈓-𑈫𑈿-𑉀𑊀-𑊆𑊈𑊊-𑊍𑊏-𑊝𑊟-𑊨𑊰-𑋞𑌅-𑌌𑌏-𑌐𑌓-𑌨𑌪-𑌰𑌲-𑌳𑌵-𑌹𑌽𑍐𑍝-𑍡𑎀-𑎉𑎋𑎎𑎐-𑎵𑎷𑏑𑏓𑐀-𑐴𑑇-𑑊𑑟-𑑡𑒀-𑒯𑓄-𑓅𑓇𑖀-𑖮𑗘-𑗛𑘀-𑘯𑙄𑚀-𑚪𑚸𑜀-𑜚𑝀-𑝆𑠀-𑠫𑢠-𑣟𑣿-𑤆𑤉𑤌-𑤓𑤕-𑤖𑤘-𑤯𑤿𑥁𑦠-𑦧𑦪-𑧐𑧡𑧣𑨀𑨋-𑨲𑨺𑩐𑩜-𑪉𑪝𑪰-𑫸𑯀-𑯠𑰀-𑰈𑰊-𑰮𑱀𑱲-𑲏𑴀-𑴆𑴈-𑴉𑴋-𑴰𑵆𑵠-𑵥𑵧-𑵨𑵪-𑶉𑶘𑶰-𑷛𑻠-𑻲𑼂𑼄-𑼐𑼒-𑼳𑾰𒀀-𒎙𒒀-𒕃𒾐-𒿰𓀀-𓐯𓑁-𓑆𓑠-𔏺𔐀-𔙆𖄀-𖄝𖠀-𖨸𖩀-𖩞𖩰-𖪾𖫐-𖫭𖬀-𖬯𖭀-𖭃𖭣-𖭷𖭽-𖮏𖵀-𖵬𖹀-𖹿𖺠-𖺸𖺻-𖻓𖼀-𖽊𖽐𖾓-𖾟𖿠-𖿡𖿣𖿲-𖿳𗀀-𘳕𘳿-𘴞𘶀-𘷲𚿰-𚿳𚿵-𚿻𚿽-𚿾𛀀-𛄢𛄲𛅐-𛅒𛅕𛅤-𛅧𛅰-𛋻𛰀-𛱪𛱰-𛱼𛲀-𛲈𛲐-𛲙𝐀-𝑔𝑖-𝒜𝒞-𝒟𝒢𝒥-𝒦𝒩-𝒬𝒮-𝒹𝒻𝒽-𝓃𝓅-𝔅𝔇-𝔊𝔍-𝔔𝔖-𝔜𝔞-𝔹𝔻-𝔾𝕀-𝕄𝕆𝕊-𝕐𝕒-𝚥𝚨-𝛀𝛂-𝛚𝛜-𝛺𝛼-𝜔𝜖-𝜴𝜶-𝝎𝝐-𝝮𝝰-𝞈𝞊-𝞨𝞪-𝟂𝟄-𝟋𝼀-𝼞𝼥-𝼪𞀰-𞁭𞄀-𞄬𞄷-𞄽𞅎𞊐-𞊭𞋀-𞋫𞓐-𞓫𞗐-𞗭𞗰𞛀-𞛞𞛠-𞛢𞛤-𞛥𞛧-𞛭𞛰-𞛴𞛾-𞛿𞟠-𞟦𞟨-𞟫𞟭-𞟮𞟰-𞟾𞠀-𞣄𞤀-𞥃𞥋𞸀-𞸃𞸅-𞸟𞸡-𞸢𞸤𞸧𞸩-𞸲𞸴-𞸷𞸹𞸻𞹂𞹇𞹉𞹋𞹍-𞹏𞹑-𞹒𞹔𞹗𞹙𞹛𞹝𞹟𞹡-𞹢𞹤𞹧-𞹪𞹬-𞹲𞹴-𞹷𞹹-𞹼𞹾𞺀-𞺉𞺋-𞺛𞺡-𞺣𞺥-𞺩𞺫-𞺻𠀀-𪛟𪜀-𫠝𫠠-𬺭𬺰-𮯠𮯰-𮹝丽-𪘀𰀀-𱍊𱍐-𳑹]'),false)
 from (select btrim(p_name,U&'\0009\000a\000b\000c\000d\0020\00a0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200a\2028\2029\202f\205f\3000\feff') n) trimmed
$fn$;

create function public.rad062_guard_profile_name() returns trigger
language plpgsql set search_path='' as $$
begin
 if TG_OP='INSERT' or new.display_name is distinct from old.display_name then
  if not public.rad062_valid_full_name(new.display_name) then
   raise exception 'full name requires three letter words and at most 100 code points' using errcode='22023';
  end if;
  new.display_name:=btrim(new.display_name,U&'\0009\000a\000b\000c\000d\0020\00a0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200a\2028\2029\202f\205f\3000\feff');
 end if;
 return new;
end $$;
create trigger rad062_profile_name before insert or update of display_name on public.profiles
for each row execute function public.rad062_guard_profile_name();

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path='' as $$
declare v text:=new.raw_user_meta_data->>'consent_version';
 n text:=new.raw_user_meta_data->>'display_name';
begin
 if not public.rad062_valid_full_name(n) then
  raise exception 'full name required' using errcode='22023';
 end if;
 if v is null or v !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then v:=null; end if;
 insert into public.profiles(user_id,display_name,consent_version,consented_at)
 values(new.id,btrim(n,U&'\0009\000a\000b\000c\000d\0020\00a0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200a\2028\2029\202f\205f\3000\feff'),v,case when v is not null then now() end);
 return new;
end $$;

-- UI entry check returns only own completion status; no email/name leakage.
create function assess.name_entry_v1() returns boolean
language plpgsql security definer set search_path='' as $$
begin
 perform 1 from public.profiles where user_id=auth.uid() for share;
 if not public.is_approved() then raise exception 'approved account required' using errcode='42501'; end if;
 return (select public.rad062_valid_full_name(display_name) from public.profiles where user_id=auth.uid());
end $$;

-- Same signatures/OIDs/ACL/config; enforce the name on student Assess entry and
-- authorization, without changing is_approved(), Practice, login or scope functions.
create or replace function assess.session_authorize_v1(p_assignment uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  if not assess.name_entry_v1() then raise exception 'full name required for Assess' using errcode='22023'; end if;
  perform 1 from assess.assignments where id=p_assignment for share;
  perform 1 from public.profiles where user_id=auth.uid() for share;
  if not public.is_approved() or not exists(
    select 1 from assess.targets t join assess.assignments a on a.id=t.assignment_id
    join assess.versions v on v.id=a.version_id
    where t.assignment_id=p_assignment and t.user_id=auth.uid() and v.available
      and v.schema_version=1 and v.track in ('mixed','full-practical')) then
    raise exception 'access denied' using errcode='42501'; end if;
end $$;

create or replace function assess.assigned_version_v1(p_assignment uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
  if not assess.name_entry_v1() then raise exception 'full name required for Assess' using errcode='22023'; end if;
  if not public.is_approved() then raise exception 'approved account required' using errcode='42501'; end if;
  select jsonb_build_object('schemaVersion',1,'assignmentId',a.id,'assignmentRevision',a.revision,
    'assessmentId',v.assessment_id,'version',v.version,'name',v.name,'track',v.track) into result
  from assess.assignments a join assess.targets t on t.assignment_id=a.id join assess.versions v on v.id=a.version_id
  where a.id=p_assignment and t.user_id=auth.uid() and v.available and v.schema_version=1 and v.track in ('mixed','full-practical');
  if result is null then raise exception 'assignment denied' using errcode='42501'; end if;
  return result;
end $$;

create or replace function assess.assigned_page_v1(p_after uuid default null,p_limit integer default 20) returns jsonb
language plpgsql security definer set search_path='' as $$
declare rows jsonb;
begin
  if not assess.name_entry_v1() then raise exception 'full name required for Assess' using errcode='22023'; end if;
  if not public.is_approved() then raise exception 'approved only' using errcode='42501'; end if;
  if p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid page' using errcode='22023'; end if;
  select coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]') into rows from (
    select a.id,v.name,v.version from assess.targets t join assess.assignments a on a.id=t.assignment_id
    join assess.versions v on v.id=a.version_id join assess.publications p on p.version_id=v.id
    where t.user_id=auth.uid() and v.available and v.track='mixed' and v.schema_version=1
      and (p_after is null or a.id>p_after) order by a.id limit p_limit
  ) q;
  return jsonb_build_object('rows',rows,'next',case when jsonb_array_length(rows)=p_limit then rows->-1->>'id' else null end);
end $$;

create or replace function assess.assigned_practical_page_v1(p_after uuid default null,p_limit integer default 20) returns jsonb
language plpgsql security definer set search_path='' as $$
declare rows jsonb;
begin
  if not assess.name_entry_v1() then raise exception 'full name required for Assess' using errcode='22023'; end if;
  if not public.is_approved() then raise exception 'approved only' using errcode='42501'; end if;
  if p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid page' using errcode='22023'; end if;
  select coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]') into rows from (
    select a.id,v.name,v.version from assess.targets t join assess.assignments a on a.id=t.assignment_id
    join assess.versions v on v.id=a.version_id join assess.practical_presentations p on p.version_id=v.id
    where t.user_id=auth.uid() and v.available and v.track='full-practical' and v.schema_version=1
      and (p_after is null or a.id>p_after) order by a.id limit p_limit
  ) q;
  return jsonb_build_object('rows',rows,'next',case when jsonb_array_length(rows)=p_limit then rows->-1->>'id' else null end);
end $$;

revoke all on function public.rad062_valid_full_name(text),public.rad062_guard_profile_name(),assess.name_entry_v1() from public,anon,authenticated,assess_worker;
-- The invoker profile trigger needs only this pure predicate, never the trigger function.
grant execute on function public.rad062_valid_full_name(text),assess.name_entry_v1() to authenticated;
commit;
