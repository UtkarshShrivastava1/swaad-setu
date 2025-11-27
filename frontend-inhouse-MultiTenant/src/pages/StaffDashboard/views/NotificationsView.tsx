import { useCalls } from "../hooks/useCalls";
import { useTenant } from "../../../context/TenantContext";

const NotificationsView = () => {
  const { rid } = useTenant();
  const { calls, isLoading, error } = useCalls({ rid });

  if (isLoading) {
    return <div>Loading notifications...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h2>Notifications</h2>
      <p>There are {calls.length} active calls.</p>
      <ul>
        {calls.map((call) => (
          <li key={call._id}>
            Call for {call.type} from table {call.tableId}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NotificationsView;
