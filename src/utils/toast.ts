import Swal, { type SweetAlertIcon } from 'sweetalert2'
import type { SweetAlertPosition } from 'sweetalert2'

const Toast = Swal.mixin({
  toast: true,
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
    toast.addEventListener('click', () => {
      Swal.close()
    })
  }
})

const showToast = (
  type: SweetAlertIcon,
  message: string,
  position: SweetAlertPosition = 'bottom-right',
  timer: number = 3000
) => {
  Toast.fire({
    icon: type,
    title: message,
    position: position,
    timer: timer,
    customClass: {
      popup: 'z-[2000]'
    }
  })
}

export default showToast
