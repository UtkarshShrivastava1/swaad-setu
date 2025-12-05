# GEMINI Doc: `AddItemDrawer.tsx`

This document provides technical guidance for interacting with and modifying the `AddItemDrawer.tsx` React component.

## 1. Component Overview

`AddItemDrawer.tsx` is a multi-purpose UI component that renders a slide-in drawer for creating a new menu item or editing an existing one. It is responsible for:

-   Rendering a form with fields for an item's properties (name, price, description, vegetarian status, etc.).
-   Managing the local state of these form fields.
-   Handling image uploads and previews.
-   Submitting data to the backend API to create, update, or delete a menu item.
-   Displaying loading and error states for API interactions.
-   Operating in two modes: "Add" mode for new items and "Edit" mode for existing items.

## 2. Props Interface

The component's behavior is controlled by the `AddItemDrawerProps`.

```typescript
interface AddItemDrawerProps {
  // Controls the visibility of the drawer.
  isOpen: boolean;
  // Callback function to close the drawer.
  onClose: () => void;
  // The category object (`{ _id, name }`) the item belongs to. Required for API calls.
  category: { _id: string; name: string } | null;
  // If an `item` object is passed, the component enters "Edit" mode, pre-filling the form with its data.
  // If `null`, it operates in "Add" mode.
  item: any | null;
  // Callback executed after a new item is successfully added.
  onItemAdded: (item: any) => void;
  // Callback executed after an item is successfully updated or deleted.
  onItemUpdated: (item: any) => void;
}
```

## 3. Core Functionality

### State Management

-   The component uses `useState` hooks to manage the state of each form input (e.g., `name`, `price`, `isVeg`).
-   An `useEffect` hook listens for changes to the `item` prop. If `item` is present, it populates the form fields with the item's data. If `item` becomes `null`, it resets all fields to their default state for adding a new item.

### API Interaction

-   **Create/Update:** The `handleSubmit` function assembles a `payload` from the current state.
    -   If in "Edit" mode (`item` exists), it calls `updateMenuItem`.
    -   If in "Add" mode, it calls `addMenuItem`.
    -   It correctly handles `multipart/form-data` when an `imageFile` is present.
-   **Delete:** The `handleDelete` function is available only in "Edit" mode and calls `deleteMenuItem` after a confirmation prompt.

## 4. How to Modify

### Example Task: Add a "Preparation Time" Field

1.  **Add New State:**
    In the state management section, add a `useState` hook for the new field.

    ```typescript
    const [prepTime, setPrepTime] = useState("");
    ```

2.  **Update the UI (JSX):**
    Add a new `<input>` field in the JSX form to allow users to enter the preparation time.

    ```tsx
    <input
      type="number"
      placeholder="Prep Time (min)"
      value={prepTime}
      onChange={(e) => setPrepTime(e.target.value)}
      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10"
    />
    ```

3.  **Integrate into API Payload:**
    In the `handleSubmit` function, add the new state variable to the `payload` object. Ensure data types are correct (e.g., using `parseInt`).

    ```typescript
    const payload = {
      item: {
        // ... other properties
        metadata: {
          spiceLevel,
          prepTime: parseInt(prepTime || "0", 10), // Add the new field
        },
      },
    };
    ```

4.  **Handle Pre-fill and Reset:**
    Update the `useEffect` hook to pre-fill the `prepTime` from the `item` prop in "Edit" mode and reset it when in "Add" mode.

    ```typescript
    // Inside useEffect(() => { ... }, [item]);
    if (item) {
        // ...
        setPrepTime(String(item.metadata?.prepTime || ""));
    } else {
        // ...
        setPrepTime("");
    }
    ```
