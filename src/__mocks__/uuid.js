let counter = 0;
const v4 = () => `mock-uuid-${++counter}`;
export { v4 };
export default { v4 };
