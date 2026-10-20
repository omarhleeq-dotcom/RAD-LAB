-- READ ONLY DIAGNOSIS. Original project vlacestfruxooznrcjqc; verify SQL Editor project selector.
-- Returns ONLY mismatching function names, body digests, lengths and diagnostic comparisons.
-- No function bodies, student rows, settings, answers, keys or grades are returned.
-- Line-ending/edge-space comparisons are TRIAGE ONLY, not semantic equivalence or install approval.
-- Does not modify the database, close/open the gate, reapply C/D or bypass the exact-body installer guard.
begin read only;
with expected(name,signature,expected_sha256,expected_octets,expected_lf_sha256,expected_trimmed_lf_sha256) as (values
 ('group_write_v1','assess.group_write_v1(uuid,text,boolean)','1cf0ef392a79a99f728da8903814ddcfc9c0910e89dc51d9dc1e5f6ad4553ae8',854,'1cf0ef392a79a99f728da8903814ddcfc9c0910e89dc51d9dc1e5f6ad4553ae8','3493e6fafc87569770eadf3882d74080dc128a6aedbc2abea6abf25ecdb7d46f'),
 ('members_write_v1','assess.members_write_v1(uuid,uuid[],boolean)','1789ac46865b450360fb8d1644e5596691fa3bc85c04f59fa61b1e5b3ca41060',1087,'1789ac46865b450360fb8d1644e5596691fa3bc85c04f59fa61b1e5b3ca41060','04d0117d56be7584e6eac4b24968aef11d98048bf7c5229d8010ee35c0b90e6d'),
 ('assign_v1','assess.assign_v1(uuid,uuid[],uuid[])','c3886247c8b61f601f7ae869d07465cfae800fb7821736a86e1e1235f50ee1e4',1922,'c3886247c8b61f601f7ae869d07465cfae800fb7821736a86e1e1235f50ee1e4','ee27830d513c3a9b7e9f5ecd85f6a43c46bfb0b5486cf890280e3ef154203fe9'),
 ('targets_write_v1','assess.targets_write_v1(uuid,integer,uuid[],boolean)','f2b7aa109447ffc5237bcd2312d4566b7a7f71b3cb6c072be1b4c3ab03178f53',1377,'f2b7aa109447ffc5237bcd2312d4566b7a7f71b3cb6c072be1b4c3ab03178f53','f926b5cd390aced613907f3946eca90ba198bc697ab423fa9437e74b33bed89d'),
 ('owner_page_v1','assess.owner_page_v1(text,uuid,text,uuid,integer)','fe4eee7cc88111fe1a68b63a36a0b74e618f34d64d5857ff1a5bc0cde29d3e7f',2790,'fe4eee7cc88111fe1a68b63a36a0b74e618f34d64d5857ff1a5bc0cde29d3e7f','6d1922d67d80e0f7ec403e61c472a1aa5be2eb8c2a74cbcd856dd7ba0075a629'),
 ('assigned_version_v1','assess.assigned_version_v1(uuid)','a659c221ff9184f0c1defae7bc4157f4bc205e3a501d2e6ade4dfbe18df1c3bb',700,'a659c221ff9184f0c1defae7bc4157f4bc205e3a501d2e6ade4dfbe18df1c3bb','4776ed241b4e9c2fe495a638789ad87aac10b41902d2e03999f757eb250f049f'),
 ('install_publication_v1','assess.install_publication_v1(uuid,jsonb,jsonb)','6c198420efc157a0f0b2605d9618e7b2941aaadae707c74968df16395e3521e9',739,'6c198420efc157a0f0b2605d9618e7b2941aaadae707c74968df16395e3521e9','e47775f14a5e18f847aad73f740905aebc0b634308ea9cf97e1f5ccc3c115f31'),
 ('session_authorize_v1','assess.session_authorize_v1(uuid)','f4475e949d292ae610595d820d46f457c549987780cfe2025ab31abd2a014db6',551,'f4475e949d292ae610595d820d46f457c549987780cfe2025ab31abd2a014db6','1f21992f06319d72bef77a073347448a1c43da6c4138af8b78e0fd36b706ba9e'),
 ('session_ack_v1','assess.session_ack_v1(uuid,uuid)','24a26227091099c3fb8c0fbdfd478bb0ca4c18cd0d21375eb1a21d8897c66187',421,'24a26227091099c3fb8c0fbdfd478bb0ca4c18cd0d21375eb1a21d8897c66187','4e7092d8b0264e493a5e1873fa70753632c37c3f01df88684619343e0264c581'),
 ('start_v1','assess.start_v1(uuid,uuid)','8ae44106cba45c9f380988004c7041277c92fca9962376e64263f9280107e324',3740,'8ae44106cba45c9f380988004c7041277c92fca9962376e64263f9280107e324','e080422989fad08c528217377262571e80d2fa53c3799932628f3b1fcc91c9af'),
 ('read_session_v1','assess.read_session_v1(uuid)','cfaa04b87af01609fd4cbe83ef1cabcd34aab39c6f409894035c0303bd902546',946,'cfaa04b87af01609fd4cbe83ef1cabcd34aab39c6f409894035c0303bd902546','16e82edd8ffbc1b7909cf0335d5a92e187488ad20dad11e702c848b1eef88078'),
 ('validate_answer_v1','assess.validate_answer_v1(jsonb,jsonb,jsonb)','443ef959d33e6eb3da6498aff60cc0cf385cc172d811b6f2bc03ae6c4fd9019d',1814,'443ef959d33e6eb3da6498aff60cc0cf385cc172d811b6f2bc03ae6c4fd9019d','0994b1ade458207fa14f101df8b783098048441d5f6ba835783d5e86a6fd1096'),
 ('command_v1','assess.command_v1(uuid,uuid,integer,jsonb)','b8d969b9e7dda62fae77150f445e77756e6332cf1c1df382605a127377d6fdf6',3533,'b8d969b9e7dda62fae77150f445e77756e6332cf1c1df382605a127377d6fdf6','3551ccfa20de2f063ac4a7f2f591be67a30d26e0280a5b54db131a403b8c77c0'),
 ('result_v1','assess.result_v1(uuid)','0826d17d24bf374dfc1cc3b2ba9f7d05a5b671a70f61638792750fbb4ed5d803',1059,'0826d17d24bf374dfc1cc3b2ba9f7d05a5b671a70f61638792750fbb4ed5d803','2a4bd05513eaecb2f5fd0ccf7f38c4656f04a780f7281f0096b7d71632047946'),
 ('maintain_v1','assess.maintain_v1(integer)','94e65490a4e91fd1241823f83ff4a16e0f6b0e01170c8117af88e6f2e0e8c1c0',1694,'94e65490a4e91fd1241823f83ff4a16e0f6b0e01170c8117af88e6f2e0e8c1c0','84797e1b6edd6aa412c423d11b9531e65ebf659645c776718d4ff74e45828d2f'),
 ('claim_v1','assess.claim_v1()','649a0e9a990c85b4d7e8dff0cfe57bc4e5a0b4292f1f8539f05a4bf5a1fa73a3',755,'649a0e9a990c85b4d7e8dff0cfe57bc4e5a0b4292f1f8539f05a4bf5a1fa73a3','2e9bfec174e6467fbe953e3c1e90d994a7a5715aa202857070ff7315a41fd7f4'),
 ('finish_v1','assess.finish_v1(uuid,uuid,text,text)','cf69d6824d61dec9ad4b1d0e9187a113a248188f4dcf32ec1e260c950e989c8b',1412,'cf69d6824d61dec9ad4b1d0e9187a113a248188f4dcf32ec1e260c950e989c8b','3af906a5ba19dd3495c04aeacc8191839eb3db99769bba45f10d6a6865ae73ec'),
 ('fail_v1','assess.fail_v1(uuid,uuid)','812fd82f88340a71d13f1742dc9b17c2bdc2cafff239c547de4c9efd924da585',485,'812fd82f88340a71d13f1742dc9b17c2bdc2cafff239c547de4c9efd924da585','5555372f74c7603d41995120e9afee2d8d3236f39853fb260b711e3abd2a1c26'),
 ('recover_v1','assess.recover_v1(uuid)','a1b8827868f3bedddfc924ed55102d3fd07bf186fc981b267b129863ff4d01f0',261,'a1b8827868f3bedddfc924ed55102d3fd07bf186fc981b267b129863ff4d01f0','800925bb1ec058ff51aa3656627afbb3bf2ab65990a7a030e1543dd74ee1a134'),
 ('health_v1','assess.health_v1()','e8625fca0d23bc66fcd9ee43a94ea40daaadff3d4d718ee3c564f38ab57590f1',375,'e8625fca0d23bc66fcd9ee43a94ea40daaadff3d4d718ee3c564f38ab57590f1','07347e1fc2b6667f80d61daa00432f9babc9a20f624cba0f25b7899b522a1f5f'),
 ('content_submit_v1','assess.content_submit_v1(jsonb)','e37ac82c55ff3d237fa46781612eb4bdd0801d2e1e46e5fe7c2512e642b0d920',1519,'e37ac82c55ff3d237fa46781612eb4bdd0801d2e1e46e5fe7c2512e642b0d920','20804b8c03a60a8e4897adca9d69dcf3139625243dacf497dbc2f01ad17c7e31'),
 ('content_page_v1','assess.content_page_v1(uuid,integer)','d0d1a4f6eea23527c84aa1da5c43bad1721120b048aa7090895bfdef6506b014',673,'d0d1a4f6eea23527c84aa1da5c43bad1721120b048aa7090895bfdef6506b014','a18ec34869e8fa8638db77f9d88f7e276a896ca95d2c891a8db03eca292a09ed'),
 ('content_read_v1','assess.content_read_v1(uuid)','7694935ebab7924049d1adb84d443b300224b8db322f0415cbe5cf2cb3524a26',98,'7694935ebab7924049d1adb84d443b300224b8db322f0415cbe5cf2cb3524a26','dcdbd3035616d6c59794b405898763668aad181a91e25f6467a1419a9536c7f5'),
 ('content_install_v1','assess.content_install_v1(uuid,jsonb)','1454d2b2d3d6ed8357fda011ad27685191924eeaea1067dbf01d7643db4f53cb',383,'1454d2b2d3d6ed8357fda011ad27685191924eeaea1067dbf01d7643db4f53cb','1323baee116c7420be6808b564727125c5beb8caffbfb9afec2cdfafa84eeb80'),
 ('assigned_page_v1','assess.assigned_page_v1(uuid,integer)','29b69f7e8f96f540d22cb4ab2584f9912a3277fc7dc7d5dea841993c115d0f05',825,'29b69f7e8f96f540d22cb4ab2584f9912a3277fc7dc7d5dea841993c115d0f05','43139e10e828fbf41348e5077f5e6d75316236d779ead4a0c89a7eeaa7b4ae11'),
 ('read_mixed_session_v1','assess.read_mixed_session_v1(uuid)','0841acf0ad8679e7bdc2cb8020101de27b4b603da256016844e149c7ad35c246',1914,'0841acf0ad8679e7bdc2cb8020101de27b4b603da256016844e149c7ad35c246','1053d5019a2546dc52689641d6f6b7a8e8ff4f28a397a5d41fbdee5eccdac913')
), observed as (
 select e.*,p.oid,p.oid::regprocedure::text as procedure_signature,l.lanname as language,
 p.prosrc,replace(replace(p.prosrc,E'\r\n',E'\n'),E'\r',E'\n') as lf_body
 from expected e left join pg_proc p on p.oid=to_regprocedure(e.signature)
 left join pg_language l on l.oid=p.prolang
), compared as (
 select name,procedure_signature,language,expected_sha256,expected_octets,
 encode(sha256(convert_to(prosrc,'UTF8')),'hex') as actual_sha256,octet_length(prosrc) as actual_octets,
 encode(sha256(convert_to(lf_body,'UTF8')),'hex')=expected_lf_sha256 as line_endings_normalized_match,
 encode(sha256(convert_to(btrim(lf_body,E' \t\n\r'),'UTF8')),'hex')=expected_trimmed_lf_sha256 as trimmed_line_endings_normalized_match,
 oid is null as function_missing
 from observed
)
select 'assess-e-source-diff/1' as contract,current_setting('transaction_read_only')='on' as read_only,
 name,procedure_signature,language,expected_sha256,actual_sha256,expected_octets,actual_octets,
 coalesce(line_endings_normalized_match,false) as line_endings_normalized_match,
 coalesce(trimmed_line_endings_normalized_match,false) as trimmed_line_endings_normalized_match,
 function_missing,false as installation_approved,false as runtime_or_launch_verified
from compared
where actual_sha256 is distinct from expected_sha256
order by name;
rollback;
