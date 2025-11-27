import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CartDrawer from "./CartDrawer";
import NewCartItem from "./NewCartItem";
import CartItem from "./CartItem";
import { getOrder, createOrder } from "../../api/order.api";
import { useCart } from "../../stores/cart.store";
import { useTable } from "../../context/TableContext";
import { useTenant } from "../../context/TenantContext";

vi.mock("../../api/order.api");
vi.mock("../../stores/cart.store");
vi.mock("../../context/TableContext");
vi.mock("../../context/TenantContext");

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

const mockGetOrder = getOrder as vi.Mock;
const mockCreateOrder = createOrder as vi.Mock;
const mockUseCart = useCart as vi.Mock;
const mockUseTable = useTable as vi.Mock;
const mockUseTenant = useTenant as vi.Mock;

const activeOrder = {
  _id: "order123",
  status: "placed",
  customerName: "John Doe",
  customerContact: "1234567890",
  customerEmail: "john.doe@example.com",
  items: [],
  restaurantId: "resto1",
  tableId: "table1",
  sessionId: "sess1",
  paymentStatus: "unpaid",
  isCustomerOrder: true,
};

const cartItems = [
  {
    itemId: "item1",
    name: "Test Item",
    quantity: 1,
    price: 100,
    notes: "",
  },
];

describe("Order Placement Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mockUseTenant.mockReturnValue({ rid: "resto1" });
    mockUseTable.mockReturnValue({ tableId: "table1" });
    sessionStorage.setItem("resto_session_id", "sess1");
  });

  const components = [
    { name: "CartDrawer", component: CartDrawer },
    { name: "NewCartItem", component: NewCartItem },
    { name: "CartItem", component: CartItem },
  ];

  components.forEach(({ name, component: Component }) => {
    describe(`${name}`, () => {
      it("should use existing order details and not prompt for new ones", async () => {
        mockGetOrder.mockResolvedValue([activeOrder]);
        mockCreateOrder.mockResolvedValue({ order: { _id: "newOrder123" } });
        mockUseCart.mockReturnValue({
          items: cartItems,
          subtotal: () => 100,
          remove: vi.fn(),
          updateQty: vi.fn(),
          clear: vi.fn(),
        });

        render(<Component />);

        const placeOrderButton = screen.getByText("Place Order");
        fireEvent.click(placeOrderButton);

        await waitFor(() => {
          expect(mockGetOrder).toHaveBeenCalledWith("resto1", "sess1");
        });

        await waitFor(() => {
          expect(mockCreateOrder).toHaveBeenCalledWith(
            "resto1",
            "table1",
            expect.objectContaining({
              customerName: "John Doe",
              customerContact: "1234567890",
              customerEmail: "john.doe@example.com",
            })
          );
        });

        expect(screen.queryByText("Enter your details")).toBeNull();
      });

      it("should prompt for details when no active order exists", async () => {
        mockGetOrder.mockResolvedValue([]);
        mockUseCart.mockReturnValue({
          items: cartItems,
          subtotal: () => 100,
        });

        render(<Component />);

        const placeOrderButton = screen.getByText("Place Order");
        fireEvent.click(placeOrderButton);

        await waitFor(() => {
          expect(mockGetOrder).toHaveBeenCalledWith("resto1", "sess1");
        });

        expect(screen.getByText("Enter your details")).toBeInTheDocument();
      });
    });
  });
});
