import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Outlet } from 'react-router-dom';
import { clearCurrentCommunity } from '../features/communities/communitiesSlice';

/** All-events layout — clears selected community; child routes render feed or detail. */
export default function AllEventsPage() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(clearCurrentCommunity());
  }, [dispatch]);

  return <Outlet />;
}
