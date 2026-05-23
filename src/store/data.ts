import { useLocalStorage } from '../hooks/useLocalStorage';
import { InventoryItem, Order, Customer, Task, User, QualityCheck } from '../types';

export function useDataStore() {
  const [users, setUsers] = useLocalStorage<User[]>('app_users', []);
  const [inventory, setInventory] = useLocalStorage<InventoryItem[]>('app_inventory', []);
  const [orders, setOrders] = useLocalStorage<Order[]>('app_orders', []);
  const [customers, setCustomers] = useLocalStorage<Customer[]>('app_customers', []);
  const [tasks, setTasks] = useLocalStorage<Task[]>('app_tasks', []);
  const [qualityChecks, setQualityChecks] = useLocalStorage<QualityCheck[]>('app_qualityChecks', []);

  return {
    users, setUsers,
    inventory, setInventory,
    orders, setOrders,
    customers, setCustomers,
    tasks, setTasks,
    qualityChecks, setQualityChecks
  };
}
