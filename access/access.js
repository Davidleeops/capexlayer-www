(() => {
  const form=document.getElementById("access-form"),result=document.getElementById("result");
  if(!form||!result)return;
  form.addEventListener("submit",async event=>{
    event.preventDefault();if(!form.reportValidity())return;
    const fields=new FormData(form),button=form.querySelector("button[type=submit]");
    button.disabled=true;result.textContent="Saving your request...";
    const payload=Object.fromEntries(fields);payload.accessConsent=fields.has("accessConsent");payload.updates=fields.has("updates");
    try{
      const response=await fetch(form.action,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const receipt=await response.json();
      if(!response.ok)throw new Error(receipt.error||"Your request did not save. Please try again.");
      form.hidden=true;result.textContent=receipt.message;
    }catch(error){result.textContent=error instanceof Error?error.message:"Your request did not save. Please try again.";}
    finally{button.disabled=false;result.focus();}
  });
})();
