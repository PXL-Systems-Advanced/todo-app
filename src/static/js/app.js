const form = document.querySelector('#new-item-form');
const input = document.querySelector('#new-item');
const list = document.querySelector('#items');
const emptyMessage = document.querySelector('#empty-message');
const errorMessage = document.querySelector('#error');

async function request(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.status === 204 ? undefined : response.json();
}

function render(items) {
  list.replaceChildren(...items.map((item) => {
    const entry = document.createElement('li');
    entry.className = item.completed ? 'completed' : '';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = item.completed;
    checkbox.setAttribute('aria-label', `Mark ${item.name} complete`);
    checkbox.addEventListener('change', async () => {
      await request(`/items/${item.id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...item, completed: checkbox.checked }),
      });
      await load();
    });

    const name = document.createElement('span');
    name.textContent = item.name;

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'Remove';
    remove.addEventListener('click', async () => {
      await request(`/items/${item.id}`, { method: 'DELETE' });
      await load();
    });

    entry.append(checkbox, name, remove);
    return entry;
  }));
  emptyMessage.hidden = items.length !== 0;
}

async function load() {
  try {
    errorMessage.textContent = '';
    render(await request('/items'));
  } catch (error) {
    errorMessage.textContent = error.message;
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await request('/items', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: input.value }),
    });
    input.value = '';
    await load();
  } catch (error) {
    errorMessage.textContent = error.message;
  }
});

load();
