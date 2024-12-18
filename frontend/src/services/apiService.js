export const fetchData = async () => {
  const response = await fetch('/api/data');
  return await response.json();
};
