# Mantine v8.1.0 - AI-Friendly Reference Guide

> **For LLMs/AI Assistants**: This document provides comprehensive, structured information about Mantine v8.1.0 to help AI assistants understand and work with this React UI library effectively.

## 📋 **Quick Overview**

**What is Mantine?**: Production-ready React UI library with 120+ components, 70+ hooks, and comprehensive theming system. Built with TypeScript, supports both light/dark themes, and focuses on accessibility and developer experience.

**Key Facts**:
- **Version**: 8.1.0 (Latest stable, June 2025)
- **License**: MIT
- **Bundle**: CSS-based (no runtime styles), optimized performance
- **TypeScript**: Full type safety, excellent IntelliSense
- **Compatibility**: React 18+, Next.js, Vite, all modern frameworks

---

## 🏗️ **Architecture & Core Concepts**

### **Package Structure** (Install as needed)
```bash
# Core (Required)
@mantine/core      # 120+ UI components (Button, Input, Modal, etc.)
@mantine/hooks     # 70+ React hooks (useDisclosure, useCounter, etc.)

# Extensions (Optional)
@mantine/form      # Form management with validation
@mantine/dates     # Date/time pickers, calendars
@mantine/charts    # Recharts-based chart components
@mantine/notifications  # Toast notifications system
@mantine/modals    # Centralized modal management
@mantine/spotlight # Command palette component
@mantine/dropzone  # File upload with drag & drop
@mantine/carousel  # Embla-based carousel
@mantine/tiptap    # Rich text editor
@mantine/code-highlight  # Code syntax highlighting
```

### **Styling System**
- **CSS Variables**: Modern CSS custom properties approach
- **PostCSS**: Uses postcss-preset-mantine for mixins and functions
- **Themeable**: Comprehensive theme object with semantic tokens
- **No Runtime**: All styles are static CSS, not CSS-in-JS
- **Responsive**: Built-in breakpoint system (xs, sm, md, lg, xl)

---

## 🎨 **Component Categories & Use Cases**

### **Form Components** (High-Priority for UI Cleanup)
```typescript
// Text Inputs
<TextInput label="Email" placeholder="Enter email" />
<PasswordInput label="Password" />
<Textarea label="Description" autosize />
<NumberInput label="Amount" min={0} max={100} />

// Selections
<Select data={['React', 'Vue', 'Angular']} label="Framework" />
<MultiSelect data={options} label="Technologies" />
<Checkbox label="I agree to terms" />
<Radio.Group label="Choose option">
  <Radio value="1" label="Option 1" />
  <Radio value="2" label="Option 2" />
</Radio.Group>

// Advanced
<DatePicker label="Select date" />
<TagsInput label="Add tags" />
<FileInput label="Upload file" />
```

### **Layout Components**
```typescript
// Containers
<Container size="lg">Content</Container>
<Stack gap="md">Vertical stack</Stack>
<Group justify="space-between">Horizontal group</Group>
<Grid><Grid.Col span={6}>Half width</Grid.Col></Grid>

// Navigation
<AppShell header={{ height: 60 }} navbar={{ width: 300 }}>
  <AppShell.Header>Header</AppShell.Header>
  <AppShell.Navbar>Sidebar</AppShell.Navbar>
  <AppShell.Main>Main content</AppShell.Main>
</AppShell>
```

### **Data Display**
```typescript
// Tables & Lists
<Table data={tableData} />
<List>
  <List.Item>Item 1</List.Item>
  <List.Item>Item 2</List.Item>
</List>

// Cards & Papers
<Card withBorder padding="lg">
  <Card.Section>Header</Card.Section>
  Content
</Card>

// Charts (Recharts-based)
<BarChart data={chartData} dataKey="month" 
  series={[{ name: 'Sales', color: 'blue' }]} />
<LineChart data={data} />
<AreaChart data={data} />
```

### **Feedback Components**
```typescript
// Overlays
<Modal opened={opened} onClose={close} title="Title">
  Modal content
</Modal>

<Drawer opened={opened} onClose={close} position="right">
  Drawer content
</Drawer>

// Notifications
import { notifications } from '@mantine/notifications';
notifications.show({
  title: 'Success',
  message: 'Operation completed',
  color: 'green'
});

// Loading states
<Loader size="sm" />
<Progress value={50} />
<Skeleton height={20} />
```

---

## 🔧 **Form Management (Critical for Your Cleanup)**

### **useForm Hook** (Replaces complex validation logic)
```typescript
import { useForm } from '@mantine/form';

// Instead of 50+ lines of custom validation
const form = useForm({
  mode: 'uncontrolled', // or 'controlled'
  initialValues: {
    name: '',
    email: '',
    age: 0,
  },
  validate: {
    name: (value) => value.length < 2 ? 'Too short' : null,
    email: (value) => /^\S+@\S+$/.test(value) ? null : 'Invalid email',
    age: (value) => value < 18 ? 'Must be 18+' : null,
  },
});

// Simple form JSX (replaces complex form components)
<form onSubmit={form.onSubmit(handleSubmit)}>
  <TextInput {...form.getInputProps('name')} label="Name" />
  <TextInput {...form.getInputProps('email')} label="Email" />
  <NumberInput {...form.getInputProps('age')} label="Age" />
  <Button type="submit">Submit</Button>
</form>
```

### **Advanced Form Features**
```typescript
// Nested objects
form.setFieldValue('user.address.street', 'Main St');

// Arrays/Lists
form.insertListItem('tags', { name: 'React' });
form.removeListItem('tags', 0);

// Validation
form.validate(); // All fields
form.validateField('email'); // Single field
form.isValid(); // Check without setting errors

// State management
form.setValues(newValues);
form.reset(); // Back to initial
form.isDirty('email'); // Check if changed
form.isTouched('email'); // Check if interacted
```

---

## 🎣 **Essential Hooks (70+ Available)**

### **State Management**
```typescript
// Counter with bounds
const [count, { increment, decrement, set, reset }] = useCounter(0, { min: 0, max: 10 });

// Boolean toggles
const [opened, { open, close, toggle }] = useDisclosure(false);

// Local storage
const [value, setValue] = useLocalStorage({ key: 'settings', defaultValue: {} });

// Previous value
const previousValue = usePrevious(currentValue);
```

### **UI Interactions**
```typescript
// Click outside
const ref = useClickOutside(() => setOpened(false));

// Hover detection  
const { hovered, ref } = useHover();

// Focus management
const focusRef = useFocusTrap();

// Viewport size
const { height, width } = useViewportSize();

// Media queries
const isMobile = useMediaQuery('(max-width: 768px)');
```

### **Performance & Effects**
```typescript
// Debounced callback
const debouncedSave = useDebouncedCallback((value) => save(value), 300);

// Throttled function
const throttledResize = useThrottle(onResize, 100);

// Interval
useInterval(() => console.log('tick'), 1000);

// Document title
useDocumentTitle('Page Title');
```

---

## 🎨 **Theming & Styling**

### **Theme Structure**
```typescript
import { createTheme, MantineProvider } from '@mantine/core';

const theme = createTheme({
  // Colors
  colors: {
    brand: ['#f0f9ff', '#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8', '#0ea5e9', '#0284c7', '#0369a1', '#075985', '#0c4a6e'],
  },
  
  // Primary color
  primaryColor: 'brand',
  
  // Breakpoints
  breakpoints: {
    xs: '36em',
    sm: '48em', 
    md: '62em',
    lg: '75em',
    xl: '88em',
  },
  
  // Component defaults
  components: {
    Button: Button.extend({
      defaultProps: { variant: 'filled' },
    }),
  },
});

<MantineProvider theme={theme}>
  <App />
</MantineProvider>
```

### **Responsive Styles**
```typescript
// CSS Modules with PostCSS mixins
.container {
  padding: 1rem;
  
  @media (max-width: $mantine-breakpoint-sm) {
    padding: 0.5rem;
  }
}

// Inline styles
<Box 
  p={{ base: 'sm', sm: 'md', lg: 'xl' }}
  bg={{ light: 'gray.1', dark: 'dark.7' }}
>
  Content
</Box>
```

---

## 🚀 **Performance Optimization Patterns**

### **Bundle Size Optimization**
```typescript
// Tree-shakeable imports
import { Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

// Avoid full imports
// ❌ import * from '@mantine/core';
// ✅ import { Button, Modal } from '@mantine/core';
```

### **Component Patterns for Large Forms**
```typescript
// Split large forms into sections
function AgentForm() {
  const form = useForm({ ... });
  
  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <BasicInfoSection form={form} />
      <AdvancedSection form={form} />
      <IntegrationsSection form={form} />
    </form>
  );
}

// Each section < 50 lines
function BasicInfoSection({ form }) {
  return (
    <Stack>
      <TextInput {...form.getInputProps('name')} label="Name" />
      <Textarea {...form.getInputProps('description')} label="Description" />
    </Stack>
  );
}
```

---

## 🆕 **v8.1.0 New Features** (June 2025)

### **DatePicker Presets**
```typescript
<DatePicker 
  type="range"
  presets={[
    { value: [today.subtract(7, 'day'), today], label: 'Last 7 days' },
    { value: [startOfMonth, today], label: 'This month' },
  ]}
/>
```

### **Enhanced Form Hook**
```typescript
// New resetField method
form.resetField('email'); // Reset single field to initial value

// Better error handling
const form = useForm({
  onSubmitPreventDefault: 'validation-failed', // Only prevent if validation fails
});
```

### **Chart Improvements**
```typescript
// Reference areas in charts
<BarChart data={data}>
  <ReferenceArea x1="Jan" x2="Mar" y1={0} y2={1000} 
    fill="gray" label="Q1 Target" />
</BarChart>
```

### **New Hooks**
```typescript
// Long press detection
const longPressHandlers = useLongPress(() => showMenu());
<Button {...longPressHandlers}>Hold me</Button>

// All hook types now exported
import type { UseCounterOptions, UseDisclosureOptions } from '@mantine/hooks';
```

---

## 🔄 **Migration Strategy for Your Codebase**

### **Phase 1: Forms (Immediate 60-80% reduction)**
```typescript
// Before: 370 lines integrations-step.tsx
// After: ~90 lines with Mantine

// Replace custom validation
const form = useForm({
  validate: {
    agentId: (value) => !value ? 'Required' : null,
    integrationId: (value) => !value ? 'Required' : null,
  }
});

// Replace custom form components
<Select 
  data={integrations.map(i => ({ value: i.id, label: i.name }))}
  {...form.getInputProps('integrationId')}
  label="Select Integration"
/>
```

### **Phase 2: Replace Complex Components**
```typescript
// Instead of custom wizard
<Stepper active={active} onStepClick={setActive}>
  <Stepper.Step label="Basic Info">
    <BasicInfoForm form={form} />
  </Stepper.Step>
  <Stepper.Step label="Advanced">
    <AdvancedForm form={form} />
  </Stepper.Step>
</Stepper>

// Instead of custom modals
const [opened, { open, close }] = useDisclosure(false);
<Modal opened={opened} onClose={close} title="Configure Integration">
  <IntegrationForm onSave={handleSave} />
</Modal>
```

### **Phase 3: Standardize Patterns**
```typescript
// Consistent notifications
import { notifications } from '@mantine/notifications';

function saveAgent(data) {
  try {
    await api.createAgent(data);
    notifications.show({
      title: 'Success',
      message: 'Agent created successfully',
      color: 'green'
    });
  } catch (error) {
    notifications.show({
      title: 'Error', 
      message: error.message,
      color: 'red'
    });
  }
}
```

---

## 🛠️ **Setup & Configuration**

### **Next.js Setup** (Your current setup)
```typescript
// app/layout.tsx
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import { ColorSchemeScript, MantineProvider } from '@mantine/core';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider>
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
```

### **PostCSS Configuration**
```javascript
// postcss.config.cjs
module.exports = {
  plugins: {
    'postcss-preset-mantine': {},
    'postcss-simple-vars': {
      variables: {
        'mantine-breakpoint-xs': '36em',
        'mantine-breakpoint-sm': '48em',
        'mantine-breakpoint-md': '62em',
        'mantine-breakpoint-lg': '75em',
        'mantine-breakpoint-xl': '88em',
      },
    },
  },
};
```

---

## 🎯 **Common Patterns & Anti-Patterns**

### **✅ Do's**
```typescript
// Use semantic prop names
<Button variant="filled" size="md" color="blue" />

// Leverage form hook for all validation
const form = useForm({ validate: zodResolver(schema) });

// Use built-in responsive props
<Stack gap={{ base: 'sm', md: 'lg' }} />

// Compose with hooks
const [opened, { open, close }] = useDisclosure();
const form = useForm({ ... });
```

### **❌ Don'ts**
```typescript
// Don't create custom form validation when form hook exists
// ❌ const [errors, setErrors] = useState({});

// Don't use inline styles for responsive design
// ❌ style={{ padding: window.innerWidth > 768 ? 20 : 10 }}

// Don't create custom modal state management
// ❌ const [modalOpen, setModalOpen] = useState(false);

// Don't override core component structure
// ❌ Use Styles API instead of deep CSS overrides
```

---

## 📚 **Quick Reference for AI Assistants**

### **When to use Mantine for code reduction:**

1. **Forms**: Any form with >20 lines → Use `useForm` hook
2. **Modals/Drawers**: Custom show/hide logic → Use `useDisclosure` 
3. **Data Tables**: Custom table components → Use `Table` component
4. **Date Selection**: Custom date pickers → Use `DatePicker`
5. **Validation**: Custom validation logic → Use form validation
6. **Notifications**: Custom toast systems → Use `notifications`
7. **Loading States**: Custom spinners → Use `Loader`, `Progress`

### **Key imports for common tasks:**
```typescript
// Core UI
import { Button, TextInput, Select, Modal, Table } from '@mantine/core';

// Form management
import { useForm } from '@mantine/form';

// State hooks
import { useDisclosure, useCounter, useLocalStorage } from '@mantine/hooks';

// Notifications
import { notifications } from '@mantine/notifications';

// Charts
import { BarChart, LineChart, AreaChart } from '@mantine/charts';
```

### **Component complexity targets:**
- **Form sections**: Aim for <50 lines each
- **Modal content**: <100 lines
- **Table components**: <80 lines
- **Chart displays**: <60 lines

---

## 🔗 **Resources & Links**

- **Official Docs**: https://mantine.dev/
- **GitHub**: https://github.com/mantinedev/mantine
- **Discord**: https://discord.gg/wbH82zuWMN
- **Examples**: https://ui.mantine.dev/
- **Changelog**: https://mantine.dev/changelog/8-1-0/

---

**Summary for AI**: Mantine v8.1.0 is a comprehensive React UI library that can reduce your form components by 60-80% and overall UI code by 40-60%. Focus on `useForm` hook for form management, built-in components for UI, and the extensive hooks library for state management. It's designed to replace custom implementations with battle-tested, accessible components.
