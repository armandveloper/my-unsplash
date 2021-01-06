const $btnAddPhoto = document.getElementById('btn-add-photo'),
	$gallery = document.getElementById('gallery');

let $modalForm, $inputLabel, $inputPhoto;
let start = -10,
	lastScrollNum;

const validFiles = ['image/jpeg', 'image/png'];

const isValidFile = (type) => validFiles.includes(type);

const showAlert = (text, classes) => {
	const $alert = document.createElement('div');
	$alert.className = classes;
	$alert.innerText = text;
	document.body.appendChild($alert);
	setTimeout(() => $alert.remove(), 2800);
};

const renderPhoto = ({ label, url, _id }, position = 'beforeend') => {
	const $galleryItem = document.createElement('div');
	$galleryItem.className = 'gallery__item';
	$galleryItem.innerHTML = `
  <img
    src="${url}"
    alt="${label}"
    class="gallery__img"
  />
  <div class="gallery__item-options">
    <button data-id="${_id}" class="btn btn--delete btn--rounded">delete</button>
    <p class="gallery__img-label">${label}</p>
  </div>
  `;
	$gallery.insertAdjacentElement(position, $galleryItem);
};

const uploadPhoto = async (label, file) => {
	const formData = new FormData();
	formData.append('label', label);
	formData.append('photo', file);
	try {
		const response = await fetch(
			'https://node-my-unsplash.herokuapp.com/api/photos',
			{
				method: 'POST',
				body: formData,
			}
		);
		const body = await response.json();
		if (!body.ok) throw body.msg;
		hideSpinner();
		renderPhoto(body.photo, 'afterbegin');
	} catch (err) {
		console.log(err);
		showAlert('Unexpected error. Please try later', 'alert alert--danger');
	}
};

const showSpinner = () => {
	const $overlay = document.getElementById('overlay');
	$overlay.id = 'overlay';
	$overlay.className = 'overlay overlay--abs-center';
	$overlay.innerHTML = '<div class="spinner"></div>';
	closeModal();
	document.body.appendChild($overlay);
};

const hideSpinner = () => closeModal();

const handlePhotoUpload = (e) => {
	e.preventDefault();
	const label = $inputLabel.value.trim(),
		file = $inputPhoto.files[0];
	if (!label || !file) {
		showAlert('All the fields are required', 'alert alert--danger');
		return;
	}
	if (!isValidFile(file.type)) {
		showAlert(
			'Invalid image extensions: should be: .jpg or png',
			'alert alert--danger'
		);
		return;
	}
	// Upload the photo
	showSpinner();
	uploadPhoto(label, file);
};

const addModalListeners = () => {
	$modalForm = document.getElementById('modal-form');
	$inputLabel = document.getElementById('label');
	$inputPhoto = document.getElementById('photo');
	$modalForm.addEventListener('submit', handlePhotoUpload);
};

const openModal = ({ target }) => {
	target.blur();
	const $overlay = document.createElement('div');
	$overlay.id = 'overlay';
	$overlay.className = 'overlay';
	$overlay.innerHTML = `
  <div class="modal">
				<h2 class="modal__heading">Add a new photo</h2>
				<form class="modal__form" id="modal-form">
					<div class="form__group">
						<label for="label" class="form__label">Label</label>
						<input
              autofocus
              type="text"
							class="form__control"
							placeholder="MY awesome photo"
              id="label"
              autocomplete="off"
              required
						/>
					</div>
					<div class="form__group">
						<label for="photo" class="btn btn--blue">
							Upload photo
						</label>
						<input type="file" id="photo" class="hidden" />
					</div>
					<div class="modal__buttons">
						<button
							type="button"
							class="btn btn--gray"
							onclick="closeModal()"
						>
							Cancel
						</button>
						<button class="btn btn--green">Submit</button>
					</div>
				</form>
			</div>
  `;
	document.body.appendChild($overlay);
	$overlay.addEventListener('click', ({ target }) => {
		if (target === $overlay) {
			$overlay.remove();
		}
	});
	addModalListeners();
};

const closeModal = (modal) => {
	if (!modal) {
		modal = document.getElementById('overlay');
	}
	modal.remove();
};

const renderPhotos = (photos) => {
	photos.forEach((photo) => renderPhoto(photo));
};

const getPhotos = async () => {
	start += 10;
	try {
		const response = await fetch(
			'https://node-my-unsplash.herokuapp.com/api/photos?start=' + start
		);
		const body = await response.json();
		if (!body.ok) throw body.msg;
		renderPhotos(body.photos);
		if (body.photos.length === 0) {
			window.removeEventListener('scroll', handleScroll);
		}
	} catch (err) {
		console.log(err);
	}
};

const handleScroll = () => {
	const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
	if (scrollTop + clientHeight >= scrollHeight - 15) {
		getPhotos();
	}
};

const deletePhoto = async (id, $item) => {
	try {
		const response = await fetch(
			'https://node-my-unsplash.herokuapp.com/api/photos/' + id,
			{
				method: 'DELETE',
			}
		);
		const body = await response.json();
		if (!body.ok) throw body.msg;
		$item.remove();
		showAlert(body.msg, 'alert alert--green');
	} catch (err) {
		showAlert(err.message, 'alert alert--danger');
	}
};

const confirmDelete = (id, $item) => {
	const $overlay = document.createElement('div');
	$overlay.id = 'overlay';
	$overlay.className = 'overlay';
	$overlay.innerHTML = `
  <div class="modal">
    <h2 class="modal__heading text-center">Are you sure?</h2>
    <div class="modal__buttons">
        <button
          type="button"
          class="btn btn--gray"
          onclick="closeModal()"
        >
          Cancel
        </button>
        <button class="btn btn--red" id="btn-delete">Delete</button>
    </div>
  </div>
  `;
	document.body.appendChild($overlay);
	$overlay.addEventListener('click', ({ target }) => {
		if (target === $overlay) {
			$overlay.remove();
		}
	});
	document.getElementById('btn-delete').addEventListener('click', () => {
		closeModal();
		deletePhoto(id, $item);
	});
};

const handleGalleryClick = ({ target }) => {
	if (target.classList.contains('btn--delete')) {
		confirmDelete(target.dataset.id, target.parentElement.parentElement);
	}
};

$btnAddPhoto.addEventListener('click', openModal);
document.addEventListener('DOMContentLoaded', async () => {
	await getPhotos();
	hideSpinner();
});
window.addEventListener('scroll', handleScroll);
$gallery.addEventListener('click', handleGalleryClick);
