<script>
	export let value = false;
	export let label = "Component";

	import {createEventDispatcher} from "svelte";
	let dispatch = createEventDispatcher();

	function onClick()
	{
		value = !value;
		dispatch("change",value);
	}
</script>

<span on:click={onClick} class={'input-box ' + (value?"selected":"")}>{label}</span>

<style>
.input-box {
	border:solid 1px white;
	padding: 0px 3px;
	cursor:pointer;
	user-select: none;
}

.input-box.selected{
	border:solid 1px transparent;

	background-color: #ff8000;
}
</style>
