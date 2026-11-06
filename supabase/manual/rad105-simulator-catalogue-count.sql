-- RAD-105 P7: READ-ONLY counts of the simulator catalogue available to supervisors. Counts only: no keys, no case ids, no content.
begin read only;
set local search_path=public;
set local lock_timeout='2s';
set local statement_timeout='10s';
select kind,active,count(*) as n from assess.authoring_references group by kind,active order by kind,active;
rollback;
